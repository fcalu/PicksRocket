import { NextResponse } from "next/server";
import { homeSpreadFromDetails, pickSpreadLabel } from "@/lib/game-picks";

export const runtime = "nodejs";

const BASE = process.env.NEXT_PUBLIC_API_BASE || process.env.API_BASE_URL || "https://edgewspmfantasy.onrender.com";

async function fetchJson(url: string, init?: RequestInit) {
  const r = await fetch(url, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init?.headers || {}),
    },
    cache: "no-store",
  });
  const text = await r.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!r.ok) {
    return { ok: false, status: r.status, data };
  }
  return { ok: true, status: r.status, data };
}

function extractNumbersByKey(obj: any, keys: string[], out: number[] = []) {
  if (obj == null) return out;
  if (Array.isArray(obj)) {
    for (const it of obj) extractNumbersByKey(it, keys, out);
    return out;
  }
  if (typeof obj === "object") {
    for (const [k, v] of Object.entries(obj)) {
      if (keys.includes(k.toLowerCase())) {
        const n = typeof v === "number" ? v : Number(v);
        if (Number.isFinite(n)) out.push(n);
      }
      extractNumbersByKey(v, keys, out);
    }
  }
  return out;
}

async function avgRecentPoints(athleteId: string, fallback = 20.5) {
  const url = `${BASE}/api/v1/nba/player/${athleteId}/gamelog`;
  const res = await fetchJson(url);
  if (!res.ok || !res.data) return fallback;
  const nums = extractNumbersByKey(res.data, ["points", "pts"]);
  if (!nums.length) return fallback;
  const recent = nums.slice(-5);
  const avg = recent.reduce((a, b) => a + b, 0) / recent.length;
  return Number.isFinite(avg) && avg > 0 ? avg : fallback;
}

async function playerPointsProjection(payload: any) {
  const url = `${BASE}/api/v1/nba/wspm/auto-projection-report`;
  const res = await fetchJson(url, { method: "POST", body: JSON.stringify(payload) });
  if (!res.ok || !res.data) return null;
  const p = res.data;
  const wspm = Number(p.wspm_projection ?? p.model_projection ?? p.projection ?? 0);
  if (!Number.isFinite(wspm) || wspm <= 0) return null;
  return {
    wspm_projection: wspm,
    edge: Number(p.edge ?? (wspm - Number(p.book_line ?? payload.book_line ?? 0))),
    book_line: Number(p.book_line ?? payload.book_line ?? 0),
    raw: p,
  };
}

function confidenceFromDiff(diff: number, line: number) {
  const denom = Math.max(1, Math.abs(line));
  const pct = (Math.abs(diff) / denom) * 100;
  if (pct >= 3.0) return "Alta";
  if (pct >= 2.0) return "Media-Alta";
  if (pct >= 1.0) return "Media";
  return "Baja";
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const date = String(body.date || "").trim(); // YYYYMMDD
  const season = Number(body.season ?? 2024);
  const season_type = Number(body.season_type ?? 2);
  const week = Math.max(1, Number(body.week ?? 1));
  const max_games = Math.max(1, Math.min(12, Number(body.max_games ?? 6)));
  const players_per_team = Math.max(5, Math.min(10, Number(body.players_per_team ?? 8)));
  const bench_points = Math.max(0, Math.min(60, Number(body.bench_points ?? 28)));

  if (!date || !/^\d{8}$/.test(date)) {
    return NextResponse.json({ error: "date requerido en formato YYYYMMDD" }, { status: 400 });
  }

  // 1) Games
  const gamesRes = await fetchJson(`${BASE}/api/v1/nba/games-with-odds?date=${date}`);
  if (!gamesRes.ok) {
    return NextResponse.json({ error: "No se pudo obtener games-with-odds", detail: gamesRes.data }, { status: 502 });
  }
  const games = (gamesRes.data?.games || []).slice(0, max_games);

  const perGame: any[] = [];
  const allPicks: any[] = [];

  for (const g of games) {
    const event_id = String(g.event_id);
    const home = g.home_team?.abbr;
    const away = g.away_team?.abbr;
    const details = g.odds?.details;
    const totalLine = Number(g.odds?.over_under ?? 0);

    // 2) Rosters
    const [homeRosterRes, awayRosterRes] = await Promise.all([
      fetchJson(`${BASE}/api/v1/nba/team/${home}/roster`),
      fetchJson(`${BASE}/api/v1/nba/team/${away}/roster`),
    ]);

    const homePlayers = (homeRosterRes.ok ? homeRosterRes.data?.players : []) || [];
    const awayPlayers = (awayRosterRes.ok ? awayRosterRes.data?.players : []) || [];

    // Select core rotation (simple heuristic: first N)
    const coreHome = homePlayers.slice(0, players_per_team);
    const coreAway = awayPlayers.slice(0, players_per_team);

    // 3) Project points for each player using their recent avg as line
    async function teamProjection(teamAbbr: string, oppAbbr: string, players: any[]) {
      const results: any[] = [];
      for (const p of players) {
        const athlete_id = String(p.athlete_id);
        const line = await avgRecentPoints(athlete_id, 20.5);
        const payload = {
          sport: "nba",
          athlete_id,
          event_id,
          season,
          season_type,
          week,
          player_name: p.name,
          player_team: teamAbbr,
          opponent_team: oppAbbr,
          position: p.position,
          market_type: "points",
          book_line: line,
        };
        const proj = await playerPointsProjection(payload);
        if (proj) results.push({ athlete_id, name: p.name, position: p.position, line, proj: proj.wspm_projection, edge: proj.edge });
      }
      const sum = results.reduce((a, x) => a + x.proj, 0);
      return { sum: sum + bench_points, players: results };
    }

    const [homeProj, awayProj] = await Promise.all([
      teamProjection(home, away, coreHome),
      teamProjection(away, home, coreAway),
    ]);

    const projectedTotal = homeProj.sum + awayProj.sum;
    const projectedMarginHome = homeProj.sum - awayProj.sum; // home - away

    const homeSpread = homeSpreadFromDetails(details, home);
    const spreadPick = homeSpread === null ? null : (() => {
      const diff = (projectedMarginHome + homeSpread); // if >0 home covers
      const pickHomeCovers = diff > 0;
      const label = pickSpreadLabel(home, away, homeSpread, pickHomeCovers);
      return {
        market: "spread",
        label,
        diff,
        confidence: confidenceFromDiff(diff, Math.abs(homeSpread)),
        homeSpread,
      };
    })();

    const totalPick = totalLine ? (() => {
      const diff = projectedTotal - totalLine;
      return {
        market: "total",
        label: diff >= 0 ? `Over ${totalLine}` : `Under ${totalLine}`,
        diff,
        confidence: confidenceFromDiff(diff, totalLine),
        totalLine,
      };
    })() : null;

    const gameOut = {
      event_id,
      matchup: g.matchup,
      home_team: g.home_team,
      away_team: g.away_team,
      odds: g.odds,
      model: {
        projected_home: homeProj.sum,
        projected_away: awayProj.sum,
        projected_total: projectedTotal,
        projected_margin_home: projectedMarginHome,
      },
      spreadPick,
      totalPick,
      inputs: {
        players_per_team,
        bench_points,
        season,
        season_type,
        week,
      },
    };

    perGame.push(gameOut);
    if (spreadPick) allPicks.push({ ...spreadPick, event_id, matchup: g.matchup, type: "Spread" });
    if (totalPick) allPicks.push({ ...totalPick, event_id, matchup: g.matchup, type: "Total" });
  }

  // Rank picks: High confidence first, then absolute diff
  const confScore: Record<string, number> = { "Alta": 4, "Media-Alta": 3, "Media": 2, "Baja": 1 };
  allPicks.sort((a, b) => {
    const c = (confScore[b.confidence] ?? 0) - (confScore[a.confidence] ?? 0);
    if (c !== 0) return c;
    return Math.abs(b.diff) - Math.abs(a.diff);
  });

  const top6 = allPicks.slice(0, 6);

  return NextResponse.json({
    date,
    top6,
    games: perGame,
    note:
      "Proyección de equipo (beta) usando motor de puntos por jugador + puntos de banca. Recomendado: validar líneas antes de apostar.",
  });
}
