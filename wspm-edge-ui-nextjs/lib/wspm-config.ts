export type SportKey = "NFL" | "NBA";

export const BASE_URL_DEFAULT = "https://edgewspmfantasy.onrender.com";

export const NFL_DEFAULT_LINES: Record<string, number> = {
  passing_yards: 220.5,
  rushing_yards: 55.5,
  receiving_yards: 50.5,
};

export const NBA_DEFAULT_LINES: Record<string, number> = {
  points: 20.5,
};

export const SPORT_CONFIG: Record<
  SportKey,
  {
    api_prefix: "nfl" | "nba";
    emoji: string;
    default_season: number;
    default_week: number;
    default_season_type: number;
    default_lines: Record<string, number>;
  }
> = {
  NFL: {
    api_prefix: "nfl",
    emoji: "🏈",
    default_season: 2024,
    default_week: 16,
    default_season_type: 2,
    default_lines: NFL_DEFAULT_LINES,
  },
  NBA: {
    api_prefix: "nba",
    emoji: "🏀",
    default_season: 2024,
    default_week: 1,
    default_season_type: 2,
    default_lines: NBA_DEFAULT_LINES,
  },
};

export function findPlayerMarketType(sport: SportKey, position?: string | null) {
  const pos = (position ?? "").toUpperCase();

  if (sport === "NFL") {
    if (pos === "QB") return "passing_yards";
    if (pos === "RB") return "rushing_yards";
    if (pos === "WR") return "receiving_yards";
    return "unknown";
  }

  // NBA (demo): all positions -> points
  if (sport === "NBA") return "points";

  return "unknown";
}
