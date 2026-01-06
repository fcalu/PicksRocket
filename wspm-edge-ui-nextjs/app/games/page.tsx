import { GamesTable } from "@/components/games-table";
import { getNbaGamesWithOdds, getNflGamesWithOdds, getSoccerGamesWithOdds, yyyymmddToday } from "@/lib/wspm";

export default async function GamesPage() {
  const date = yyyymmddToday();

  const [nba, nfl, soccer] = await Promise.all([
    getNbaGamesWithOdds(date).catch((e) => ({ games: [], error: String(e) })),
    getNflGamesWithOdds(date).catch((e) => ({ games: [], error: String(e) })),
    getSoccerGamesWithOdds(date).catch((e) => ({ games: [], error: String(e) })),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Juegos</h1>
        <p className="text-sm text-slate-600 mt-1">Odds y matchups por deporte (fecha {date}).</p>
      </div>

      <GamesTable title="NBA" games={nba.games ?? []} error={nba.error} />
      <GamesTable title="NFL" games={nfl.games ?? []} error={nfl.error} />
      <GamesTable title="Soccer" games={soccer.games ?? []} error={soccer.error} />
    </div>
  );
}
