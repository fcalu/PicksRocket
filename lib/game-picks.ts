export type GameOdds = {
  provider?: string;
  details?: string; // e.g. "BOS -11.5"
  over_under?: number;
};

export type TeamRef = { name: string; abbr: string };

export type GameRow = {
  event_id: string;
  matchup: string;
  home_team: TeamRef;
  away_team: TeamRef;
  odds: GameOdds;
};

export function parseOddsDetails(details?: string): { fav?: string; spread?: number } {
  if (!details) return {};
  // Expected format: "BOS -11.5" or "NY -1.5"
  const parts = details.trim().split(/\s+/);
  if (parts.length < 2) return {};
  const fav = parts[0].toUpperCase();
  const spread = Number(parts[1]);
  if (!Number.isFinite(spread)) return { fav };
  return { fav, spread };
}

export function homeSpreadFromDetails(details: string | undefined, homeAbbr: string): number | null {
  const parsed = parseOddsDetails(details);
  if (!parsed.fav || parsed.spread === undefined) return null;
  const fav = parsed.fav.toUpperCase();
  const home = homeAbbr.toUpperCase();
  const spreadAbs = Math.abs(parsed.spread);
  // If home is favored, home spread is negative; else positive
  return fav === home ? -spreadAbs : +spreadAbs;
}

export function pickSpreadLabel(homeAbbr: string, awayAbbr: string, homeSpread: number, pickHomeCovers: boolean) {
  // Display in standard bookmaker style: favored team -X, dog +X
  if (pickHomeCovers) {
    return `${homeAbbr} ${homeSpread > 0 ? `+${homeSpread}` : `${homeSpread}`}`;
  }
  const awaySpread = -homeSpread;
  return `${awayAbbr} ${awaySpread > 0 ? `+${awaySpread}` : `${awaySpread}`}`;
}
