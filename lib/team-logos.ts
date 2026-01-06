export type LeagueKey = "nfl" | "nba" | "soccer";

/**
 * Returns a logo URL for a team.
 * - NFL/NBA: ESPN CDN (abbreviation-based)
 * - Soccer: resolved at runtime via /api/wspm/soccer/team-logo (since ESPN uses numeric team ids)
 */
export function teamLogoUrl(league: LeagueKey, abbr: string): string {
  const a = (abbr || "").trim().toLowerCase();
  if (!a) return "";

  if (league === "nfl") {
    return `https://a.espncdn.com/combiner/i?img=/i/teamlogos/nfl/500/${encodeURIComponent(
      a
    )}.png&w=80&h=80&scale=crop`;
  }

  if (league === "nba") {
    return `https://a.espncdn.com/combiner/i?img=/i/teamlogos/nba/500/${encodeURIComponent(
      a
    )}.png&w=80&h=80&scale=crop`;
  }

  return "";
}
