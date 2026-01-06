import { NextResponse } from "next/server";

type LeagueCode = string;

type TeamRef = { name: string; abbr: string };

type SoccerGameRow = {
  event_id: string;
  matchup: string;
  home_team: TeamRef;
  away_team: TeamRef;
  odds?: { provider?: string; details?: string; over_under?: number };
};

type SoccerProjection = {
  event_id: string;
  league_code: LeagueCode;
  matchup: string;
  home_team: TeamRef;
  away_team: TeamRef;
  book_over_under?: number | null;
  expected_goals?: number | null;
  prob_over25?: number | null;
  prob_1?: number | null;
  prob_X?: number | null;
  prob_2?: number | null;
  over25_pick?: { pick: string; confidence?: string; prob?: number; edge_pct?: number | null; note?: string };
  pick_1x2?: { pick: string; confidence?: string; prob?: number; edge_pct?: number | null; note?: string };
  double_chance_best?: { pick: string; confidence?: string; prob?: number; edge_pct?: number | null; note?: string };
};

type Confidence = "Alta" | "Media" | "Baja";

type AiPick = {
  sport: "soccer";
  league: string;
  league_code: string;
  event_id: string;
  matchup: string;
  home_team: TeamRef;
  away_team: TeamRef;

  market: "TOTAL_25" | "BTTS" | "1X2" | "DOUBLE_CHANCE";
  pick: string; // e.g. "Over 2.5", "AA: Sí", "Juventus", "12"
  confidence: Confidence;
  prob: number; // 0..1
  edge_pct?: number | null;
  note?: string;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "https://edgewspmfantasy.onrender.com";

function clamp01(x: number) {
  if (Number.isNaN(x)) return 0;
  if (x < 0) return 0;
  if (x > 1) return 1;
  return x;
}

function confidenceFromProb(p: number): Confidence {
  const x = clamp01(p);
  if (x >= 0.62) return "Alta";
  if (x >= 0.56) return "Media";
  return "Baja";
}

function confScore(c: Confidence): number {
  if (c === "Alta") return 3;
  if (c === "Media") return 2;
  return 1;
}

function marketWeight(m: AiPick["market"]): number {
  // Most credible markets first for typical users.
  switch (m) {
    case "DOUBLE_CHANCE":
      return 4;
    case "TOTAL_25":
      return 3;
    case "BTTS":
      return 2;
    case "1X2":
      return 1;
  }
}

function normalizeTeamName(s: string) {
  return (s || "")
    .toLowerCase()
    .replace(/\b(fc|cf|sc|ac|club)\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function deriveGoalShares(prob1?: number | null, probX?: number | null, prob2?: number | null) {
  const p1 = clamp01(prob1 ?? 0);
  const px = clamp01(probX ?? 0);
  const p2 = clamp01(prob2 ?? 0);

  const home = p1 + 0.5 * px;
  const away = p2 + 0.5 * px;
  const sum = home + away;

  if (sum <= 0) return { home: 0.5, away: 0.5 };
  return { home: home / sum, away: away / sum };
}

function poissonP0(lambda: number) {
  const l = Math.max(0, lambda);
  return Math.exp(-l);
}

function computeBttsYesProb(totalXg: number | null | undefined, prob1?: number | null, probX?: number | null, prob2?: number | null) {
  const xg = totalXg ?? 0;
  if (!Number.isFinite(xg) || xg <= 0) return 0;

  const shares = deriveGoalShares(prob1, probX, prob2);
  const lamHome = xg * shares.home;
  const lamAway = xg * shares.away;

  const pHomeScores = 1 - poissonP0(lamHome);
  const pAwayScores = 1 - poissonP0(lamAway);

  return clamp01(pHomeScores * pAwayScores);
}

async function fetchGamesWithOdds(league: string): Promise<SoccerGameRow[]> {
  const res = await fetch(`${API_BASE}/api/v1/soccer/games-with-odds?league=${encodeURIComponent(league)}`, {
    headers: { accept: "application/json" },
    // Cache on the server for a short window.
    next: { revalidate: 120 },
  });

  if (!res.ok) throw new Error(`games-with-odds ${res.status}`);
  const data: any = await res.json();
  return (data?.games ?? data ?? []) as SoccerGameRow[];
}

async function fetchProjection(event_id: string, league: string): Promise<SoccerProjection> {
  const res = await fetch(`${API_BASE}/api/v1/soccer/game-projection`, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({ event_id, league }),
    // no-store: projection is per game; user expects freshness.
    cache: "no-store",
  });

  if (!res.ok) throw new Error(`game-projection ${res.status}`);
  return (await res.json()) as SoccerProjection;
}

function buildCandidates(proj: SoccerProjection): AiPick[] {
  const out: AiPick[] = [];

  const base = {
    sport: "soccer" as const,
    league: proj.league_code,
    league_code: proj.league_code,
    event_id: proj.event_id,
    matchup: proj.matchup,
    home_team: proj.home_team,
    away_team: proj.away_team,
  };

  // 1) Double chance (safer)
  const dc = proj.double_chance_best;
  if (dc?.pick && dc.pick !== "NO BET" && typeof dc.prob === "number") {
    const prob = clamp01(dc.prob);
    if (prob >= 0.66) {
      out.push({
        ...base,
        market: "DOUBLE_CHANCE",
        pick: dc.pick, // 1X / X2 / 12
        confidence: (dc.confidence as Confidence) ?? confidenceFromProb(prob),
        prob,
        edge_pct: dc.edge_pct ?? null,
        note: dc.note,
      });
    }
  }

  // 2) Total 2.5 (prefer Over 2.5 for user familiarity)
  const pOver25 = clamp01(proj.prob_over25 ?? (proj.over25_pick?.prob ?? 0));
  if (pOver25 >= 0.55) {
    out.push({
      ...base,
      market: "TOTAL_25",
      pick: "Over 2.5",
      confidence: confidenceFromProb(pOver25),
      prob: pOver25,
      edge_pct: proj.over25_pick?.edge_pct ?? null,
      note: proj.over25_pick?.note ?? "Basado en expected goals vs línea 2.5.",
    });
  } else if (pOver25 <= 0.45) {
    const pUnder = clamp01(1 - pOver25);
    if (pUnder >= 0.55) {
      out.push({
        ...base,
        market: "TOTAL_25",
        pick: "Under 2.5",
        confidence: confidenceFromProb(pUnder),
        prob: pUnder,
        edge_pct: proj.over25_pick?.edge_pct ?? null,
        note: proj.over25_pick?.note ?? "Basado en expected goals vs línea 2.5.",
      });
    }
  }

  // 3) Ambos anotan (BTTS / AA)
  const pBttsYes = computeBttsYesProb(proj.expected_goals ?? null, proj.prob_1, proj.prob_X, proj.prob_2);
  if (pBttsYes >= 0.55) {
    out.push({
      ...base,
      market: "BTTS",
      pick: "AA: Sí",
      confidence: confidenceFromProb(pBttsYes),
      prob: pBttsYes,
      edge_pct: null,
      note: "Heurística Poisson (xG total + reparto por fuerza relativa).",
    });
  }

  // 4) Winner (1X2) - avoid draw for credibility
  const pick1x2 = proj.pick_1x2?.pick;
  const p1 = clamp01(proj.prob_1 ?? 0);
  const p2 = clamp01(proj.prob_2 ?? 0);

  if (pick1x2 === "1" && p1 >= 0.46) {
    out.push({
      ...base,
      market: "1X2",
      pick: proj.home_team?.name ?? "Local",
      confidence: confidenceFromProb(p1),
      prob: p1,
      edge_pct: proj.pick_1x2?.edge_pct ?? null,
      note: proj.pick_1x2?.note ?? "Probabilidad 1X2 derivada del modelo.",
    });
  }

  if (pick1x2 === "2" && p2 >= 0.46) {
    out.push({
      ...base,
      market: "1X2",
      pick: proj.away_team?.name ?? "Visitante",
      confidence: confidenceFromProb(p2),
      prob: p2,
      edge_pct: proj.pick_1x2?.edge_pct ?? null,
      note: proj.pick_1x2?.note ?? "Probabilidad 1X2 derivada del modelo.",
    });
  }

  return out;
}

function scorePick(p: AiPick) {
  // Keep it simple and explainable:
  //  - Market weight prioritizes safer / more common markets
  //  - Confidence then probability
  const m = marketWeight(p.market);
  const c = confScore(p.confidence);
  const prob = clamp01(p.prob);
  const edge = typeof p.edge_pct === "number" ? p.edge_pct : 0;

  return m * 100 + c * 15 + prob * 50 + edge * 0.25;
}

function dedupeByEventBest(picks: AiPick[]) {
  const best = new Map<string, AiPick>();
  for (const p of picks) {
    const prev = best.get(p.event_id);
    if (!prev || scorePick(p) > scorePick(prev)) best.set(p.event_id, p);
  }
  return Array.from(best.values());
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const league = (searchParams.get("league") || "eng.1").trim();

  try {
    const games = await fetchGamesWithOdds(league);

    // Fetch projections in parallel (bounded)
    const projections: SoccerProjection[] = [];
    const concurrency = 6;

    for (let i = 0; i < games.length; i += concurrency) {
      const slice = games.slice(i, i + concurrency);
      const chunk = await Promise.all(
        slice.map((g) => fetchProjection(g.event_id, league).catch(() => null as any))
      );
      for (const p of chunk) if (p) projections.push(p);
    }

    const candidates = projections.flatMap((p) => buildCandidates(p));

    const perGame = dedupeByEventBest(candidates);

    const ranked = perGame
      .sort((a, b) => scorePick(b) - scorePick(a))
      .slice(0, 6);

    return NextResponse.json(
      {
        league,
        picks: ranked,
        note:
          "Top 6 seleccionados por credibilidad (mercado), confianza y probabilidad. Las selecciones son probabilísticas.",
      },
      { status: 200 }
    );
  } catch (e: any) {
    return NextResponse.json(
      { league, picks: [], error: e?.message ?? "Failed to generate picks" },
      { status: 500 }
    );
  }
}
