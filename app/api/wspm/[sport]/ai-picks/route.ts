import { NextResponse } from "next/server";
import { SPORT_CONFIG, type SportKey, findPlayerMarketType } from "@/lib/wspm-config";
import { computeDirectionAndMargin, classifyConfidenceFromMargin, estimateProbCover } from "@/lib/wspm-math";
import { summarizeProjection } from "@/lib/wspm-normalize";

const DEFAULT_BASE = "https://edgewspmfantasy.onrender.com";

function baseUrl() {
  const env = process.env.NEXT_PUBLIC_API_BASE;
  return (env && env.trim().length > 0 ? env : DEFAULT_BASE).replace(/\/$/, "");
}

type GameRow = {
  event_id: string;
  matchup: string;
  home_team?: { abbr?: string; name?: string };
  away_team?: { abbr?: string; name?: string };
  odds?: { provider?: string; details?: string; over_under?: number | null };
};

type Roster = {
  players?: Array<{ athlete_id: string | number; name: string; position?: string | null }>;
};

type AiPicksRequest = {
  sport?: "nfl" | "nba";
  // NFL
  season?: number;
  season_type?: number;
  week?: number;
  // NBA
  date?: string; // YYYYMMDD
  // controls
  max_games?: number; // 0=all
  picks_count?: number; // default 6
  lines_override?: Record<string, number>; // e.g. { passing_yards: 225.5 }
};

function tierRank(tier: string) {
  const t = (tier || "").toLowerCase();
  if (t === "platinum") return 4;
  if (t === "premium") return 3;
  if (t === "value") return 2;
  if (t === "leans") return 1;
  return 0;
}

async function fetchJson(url: string) {
  const res = await fetch(url, { headers: { accept: "application/json" }, cache: "no-store" });
  const text = await res.text();
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${text.slice(0, 300)}`);
  return JSON.parse(text);
}

async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T, idx: number) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length) as any;
  let i = 0;
  const workers = new Array(Math.min(limit, items.length)).fill(0).map(async () => {
    while (true) {
      const idx = i++;
      if (idx >= items.length) break;
      out[idx] = await fn(items[idx], idx);
    }
  });
  await Promise.all(workers);
  return out;
}

function pickKeyPlayers(roster: Roster | null, sportKey: SportKey) {
  const players = roster?.players ?? [];
  if (sportKey === "NFL") {
    const qbs = players.filter((p) => (p.position ?? "").toUpperCase() === "QB").slice(0, 1);
    const rbs = players.filter((p) => (p.position ?? "").toUpperCase() === "RB").slice(0, 2);
    const wrs = players.filter((p) => (p.position ?? "").toUpperCase() === "WR").slice(0, 2);
    return [...qbs, ...rbs, ...wrs];
  }
  // NBA: first 3 players (simple heuristic)
  return players.slice(0, 3);
}

export async function POST(req: Request, ctx: { params: { sport: string } }) {
  const sportPrefix = (ctx.params.sport || "").toLowerCase();
  if (!["nfl", "nba"].includes(sportPrefix)) {
    return NextResponse.json({ error: "Invalid sport" }, { status: 400 });
  }

  const body = (await req.json().catch(() => null)) as AiPicksRequest | null;
  if (!body) return NextResponse.json({ error: "Missing JSON body" }, { status: 400 });

  const picksCount = Number(body.picks_count ?? 6) || 6;
  const maxGames = Number(body.max_games ?? 0) || 0;

  const sportKey: SportKey = sportPrefix === "nfl" ? "NFL" : "NBA";
  const cfg = SPORT_CONFIG[sportKey];

  // Build games-with-odds URL
  let gamesUrl = `${baseUrl()}/api/v1/${sportPrefix}/games-with-odds`;
  if (sportKey === "NFL") {
    const season = Number(body.season ?? cfg.default_season);
    const seasonType = Number(body.season_type ?? cfg.default_season_type);
    const week = Number(body.week ?? cfg.default_week);
    gamesUrl += `?season=${encodeURIComponent(String(season))}&season_type=${encodeURIComponent(String(seasonType))}&week=${encodeURIComponent(String(week))}`;
  } else {
    const date = String(body.date ?? "");
    if (!date || date.length < 8) {
      return NextResponse.json({ error: "NBA requires date in YYYYMMDD" }, { status: 400 });
    }
    gamesUrl += `?date=${encodeURIComponent(date)}`;
  }

  // Get games
  let games: GameRow[] = [];
  try {
    const data = await fetchJson(gamesUrl);
    games = (data?.games ?? []) as GameRow[];
  } catch (e: any) {
    return NextResponse.json({ error: `Failed to fetch games: ${String(e?.message ?? e)}` }, { status: 502 });
  }

  if (!games.length) {
    return NextResponse.json({ sport: sportPrefix, picks: [], diagnostics: { games: 0 } }, { status: 200 });
  }

  if (maxGames > 0) games = games.slice(0, maxGames);

  const season = sportKey === "NFL" ? Number(body.season ?? cfg.default_season) : Number(body.season ?? cfg.default_season);
  let seasonType = sportKey === "NFL" ? Number(body.season_type ?? cfg.default_season_type) : Number(body.season_type ?? cfg.default_season_type);
  let week = sportKey === "NFL" ? Number(body.week ?? cfg.default_week) : Number(body.week ?? cfg.default_week);

  // NBA backend constraint safeguard
  if (sportKey === "NBA") {
    if (seasonType < 1) seasonType = 1;
    if (week < 1) week = 1;
  }

  const linesOverride = body.lines_override ?? {};

  type Candidate = {
    game: GameRow;
    team: string;
    opp: string;
    player: { athlete_id: string | number; name: string; position?: string | null };
    market_type: string;
    book_line: number;
  };

  // Build candidates (rosters are fetched later with concurrency)
  const teamPairs: Array<{ game: GameRow; team: string; opp: string }> = [];
  for (const g of games) {
    const h = g.home_team?.abbr;
    const a = g.away_team?.abbr;
    if (h && a) {
      teamPairs.push({ game: g, team: h, opp: a });
      teamPairs.push({ game: g, team: a, opp: h });
    }
  }

  // Fetch rosters with limit
  const rosterCache = new Map<string, Roster | null>();
  async function getRoster(teamAbbr: string) {
    if (rosterCache.has(teamAbbr)) return rosterCache.get(teamAbbr)!;
    const url = `${baseUrl()}/api/v1/${sportPrefix}/team/${encodeURIComponent(teamAbbr)}/roster`;
    try {
      const data = await fetchJson(url);
      rosterCache.set(teamAbbr, data as Roster);
      return data as Roster;
    } catch {
      rosterCache.set(teamAbbr, null);
      return null;
    }
  }

  const candidates: Candidate[] = [];
  await mapLimit(teamPairs, 6, async (tp) => {
    const roster = await getRoster(tp.team);
    const keyPlayers = pickKeyPlayers(roster, sportKey);

    for (const p of keyPlayers) {
      const market = findPlayerMarketType(sportKey, p.position);
      if (market === "unknown") continue;
      const defaultLine = cfg.default_lines[market] ?? 20.5;
      const bookLine = Number(linesOverride[market] ?? defaultLine) || defaultLine;

      candidates.push({
        game: tp.game,
        team: tp.team,
        opp: tp.opp,
        player: p,
        market_type: market,
        book_line: bookLine,
      });
    }
  });

  if (!candidates.length) {
    return NextResponse.json(
      {
        sport: sportPrefix,
        picks: [],
        diagnostics: { games: games.length, candidates: 0 },
      },
      { status: 200 }
    );
  }

  // Call projections with limit (this is the heavy part)
  const projectionUrl = `${baseUrl()}/api/v1/${sportPrefix}/wspm/auto-projection-report`;

  const results = await mapLimit(candidates, 6, async (c) => {
    const payload = {
      sport: sportKey.toLowerCase(),
      athlete_id: String(c.player.athlete_id),
      event_id: String(c.game.event_id),
      season: Number(season),
      season_type: Number(seasonType),
      week: Number(week),
      player_name: c.player.name,
      player_team: c.team,
      opponent_team: c.opp,
      position: c.player.position ?? "",
      market_type: c.market_type,
      book_line: Number(c.book_line),
    };

    try {
      const res = await fetch(projectionUrl, {
        method: "POST",
        headers: { "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      if (!res.ok) {
        return { ok: false as const, error: `HTTP ${res.status}: ${text.slice(0, 250)}`, candidate: c };
      }

      const json = JSON.parse(text);
      const { wspmProj, bookLine, edge, safetyMarginPct, tier } = summarizeProjection(json);
      const { direction, marginAbs, marginPct } = computeDirectionAndMargin(wspmProj, bookLine);
      const effectivePct = safetyMarginPct && safetyMarginPct > 0 ? safetyMarginPct : marginPct;
      const confidence = classifyConfidenceFromMargin(effectivePct);
      const probCover = estimateProbCover(effectivePct) * 100;

      return {
        ok: true as const,
        pick: {
          matchup: c.game.matchup,
          event_id: c.game.event_id,
          provider: c.game.odds?.provider ?? null,
          details: c.game.odds?.details ?? null,
          over_under: c.game.odds?.over_under ?? null,
          team: c.team,
          opp: c.opp,
          athlete_id: String(c.player.athlete_id),
          player_name: c.player.name,
          position: c.player.position ?? "",
          market_type: c.market_type,
          book_line: bookLine,
          wspm_projection: wspmProj,
          edge,
          direction,
          margin_abs: marginAbs,
          margin_pct: effectivePct,
          prob_cover: probCover,
          confidence,
          tier,
          safety_margin_pct: safetyMarginPct || 0,
          raw: json,
        },
      };
    } catch (e: any) {
      return { ok: false as const, error: String(e?.message ?? e), candidate: c };
    }
  });

  const okPicks = results.filter((r) => r.ok).map((r: any) => r.pick);
  const errors = results.filter((r) => !r.ok).slice(0, 20);

  // Sort picks (tier, prob, margin, edge)
  okPicks.sort((a: any, b: any) => {
    const tr = tierRank(b.tier) - tierRank(a.tier);
    if (tr !== 0) return tr;
    const pr = (b.prob_cover ?? 0) - (a.prob_cover ?? 0);
    if (pr !== 0) return pr;
    const mr = (b.margin_pct ?? 0) - (a.margin_pct ?? 0);
    if (mr !== 0) return mr;
    return (b.edge ?? 0) - (a.edge ?? 0);
  });

  // Soft-quality filter first; if not enough, relax
  const strong = okPicks.filter((p: any) => (p.margin_pct ?? 0) >= 10);
  const medium = okPicks.filter((p: any) => (p.margin_pct ?? 0) >= 5);

  let finalPicks = strong.slice(0, picksCount);
  if (finalPicks.length < picksCount) finalPicks = medium.slice(0, picksCount);
  if (finalPicks.length < picksCount) finalPicks = okPicks.slice(0, picksCount);

  return NextResponse.json(
    {
      sport: sportPrefix,
      generated_at: new Date().toISOString(),
      assumptions: {
        note:
          "Estas recomendaciones usan líneas por defecto (o overrides) si no tienes líneas reales del book para props. Ajusta 'book_line' o integra un proveedor de props para precisión.",
      },
      diagnostics: { games: games.length, candidates: candidates.length, projections_ok: okPicks.length, errors: errors.length },
      picks: finalPicks,
      errors,
    },
    { status: 200 }
  );
}
