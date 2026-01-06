import { GamesTable } from "@/components/games-table";
import { getSoccerTournaments, getSoccerGamesWithOdds } from "@/lib/wspm";
import { firstAvailableGamesByDate, nflFallbackByWeek } from "@/lib/upcoming";

export const runtime = "nodejs";

export default async function GamesPage({
  searchParams,
}: {
  searchParams?: { league?: string };
}) {
  // Soccer league selection (optional)
  const tournaments = await getSoccerTournaments().catch(() => ({ tournaments: [] }));
  const defaultLeague =
    searchParams?.league ||
    tournaments.tournaments.find((t) => t.is_default)?.league_code ||
    tournaments.tournaments[0]?.league_code ||
    "eng.1";

  const [nbaNext, nflNextTry, soccer] = await Promise.all([
    firstAvailableGamesByDate("nba", 7).catch(() => ({ date: "", games: [], note: "" })),
    firstAvailableGamesByDate("nfl", 14).catch(() => ({ date: "", games: [], note: "" })),
    getSoccerGamesWithOdds(defaultLeague).catch(() => ({ games: [] })),
  ]);

  let nfl = nflNextTry;
  let nflNote = nflNextTry.note;
  if (!nfl.games?.length) {
    const fb = await nflFallbackByWeek();
    nfl = { date: nflNextTry.date, games: fb.games, note: fb.note ?? nflNextTry.note };
    nflNote = nfl.note;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Juegos por empezar</h1>
        <p className="text-sm text-slate-600 mt-1">
          Listado de juegos disponibles en tu backend. NBA y NFL se buscan automáticamente en los próximos días; Soccer se carga por liga.
        </p>
      </div>

      <GamesTable league="nba" title={`NBA • Próximos juegos (fecha ${nbaNext.date || "—"})`} games={nbaNext.games ?? []} error={nbaNext.note} />

      <GamesTable league="nfl" title={`NFL • Próximos juegos (${nfl.date || "—"})`} games={nfl.games ?? []} error={nflNote} />

      <GamesTable
        league="soccer"
        soccerLeagueCode={defaultLeague}
        title={`Soccer • Próximos juegos (${defaultLeague})`}
        games={(soccer.games ?? []) as any}
      />
    </div>
  );
}
