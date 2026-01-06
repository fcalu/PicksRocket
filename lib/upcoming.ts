import { GameRow } from "@/lib/wspm-types";
import { yyyymmddOffset, getNbaGamesWithOdds, getNflGamesWithOddsByDate, getNflGamesWithOddsByWeek } from "@/lib/wspm";

/**
 * Finds the first date (today + up to daysAhead) that returns at least 1 game.
 */
export async function firstAvailableGamesByDate(
  sport: "nba" | "nfl",
  daysAhead: number = 7
): Promise<{ date: string; games: GameRow[]; note?: string }> {
  for (let i = 0; i <= daysAhead; i++) {
    const date = yyyymmddOffset(i);
    try {
      if (sport === "nba") {
        const { games } = await getNbaGamesWithOdds(date);
        if (games?.length) return { date, games };
      } else {
        const { games } = await getNflGamesWithOddsByDate(date);
        if (games?.length) return { date, games };
      }
    } catch (e) {
      // ignore and try next date
    }
  }
  return { date: yyyymmddOffset(0), games: [], note: "Sin juegos disponibles en los próximos días." };
}

/**
 * NFL fallback: use configured season/week when date-based endpoint isn't available.
 */
export async function nflFallbackByWeek(): Promise<{ games: GameRow[]; note?: string }> {
  const season = Number(process.env.NEXT_PUBLIC_NFL_SEASON ?? "2024");
  const season_type = Number(process.env.NEXT_PUBLIC_NFL_SEASON_TYPE ?? "2"); // 2 = regular
  const week = Number(process.env.NEXT_PUBLIC_NFL_WEEK ?? "1");

  try {
    const { games } = await getNflGamesWithOddsByWeek({ season, season_type, week });
    return { games, note: `NFL por semana (season=${season}, type=${season_type}, week=${week})` };
  } catch (e) {
    return { games: [], note: "No se pudo cargar NFL (date/week)." };
  }
}
