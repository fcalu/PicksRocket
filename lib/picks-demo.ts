import { GameRow } from "@/lib/wspm-types";

export type SeedPick = {
  league: "NBA";
  event_id: string;
  matchup: string;
  book: string;
  home_abbr?: string;
  away_abbr?: string;
  market: "SPREAD" | "TOTAL";
  selection: string;
  edge: number;
  confidence: number;
  stake: number;
};

function parseSpread(details?: string): number | null {
  if (!details) return null;
  const m = details.match(/([+-]?\d+(?:\.\d+)?)/);
  if (!m) return null;
  const v = Number(m[1]);
  return Number.isFinite(v) ? v : null;
}

function clamp(x: number, a: number, b: number) {
  return Math.max(a, Math.min(b, x));
}

export function buildSeedPicks(games: GameRow[]): SeedPick[] {
  const picks: SeedPick[] = [];

  for (const g of games) {
    const book = g.odds?.provider ?? "Book";
    const spread = parseSpread(g.odds?.details);
    const total = typeof g.odds?.over_under === "number" ? g.odds.over_under : null;

    const base = spread !== null ? Math.abs(spread) : total !== null ? Math.abs((total % 10) - 5) : 2.5;
    const edge = clamp(6 - base, 0.5, 6.5);

    const conf = clamp(0.5 + (edge - 2.0) * 0.03, 0.48, 0.68);
    const stake = edge >= 4.5 ? 2 : edge >= 3.0 ? 1.5 : 1.0;

    if (spread !== null) {
      picks.push({
        league: "NBA",
        event_id: g.event_id,
        matchup: g.matchup,
        book,
        home_abbr: g.home_team?.abbr,
        away_abbr: g.away_team?.abbr,
        market: "SPREAD",
        selection: `${g.odds?.details ?? "Spread"}`,
        edge,
        confidence: conf,
        stake,
      });
    } else if (total !== null) {
      const sel = total >= 220 ? `Under ${total}` : `Over ${total}`;
      picks.push({
        league: "NBA",
        event_id: g.event_id,
        matchup: g.matchup,
        book,
        home_abbr: g.home_team?.abbr,
        away_abbr: g.away_team?.abbr,
        market: "TOTAL",
        selection: sel,
        edge,
        confidence: conf,
        stake,
      });
    }
  }

  picks.sort((a, b) => b.edge - a.edge || b.confidence - a.confidence);
  return picks;
}

// Backward-compatible alias for UI components
export const buildPicks = buildSeedPicks;
