import Link from "next/link";
import { getSoccerGamesWithOdds, getSoccerTournaments } from "@/lib/wspm";
import { LeaguePicker } from "@/components/soccer/league-picker";
import { GamesTable } from "@/components/games-table";
import { Badge } from "@/components/ui/badge";

export default async function SoccerPage({
  searchParams,
}: {
  searchParams?: { league?: string };
}) {
  const tResp = await getSoccerTournaments().catch(() => ({ tournaments: [] as any[] }));
  const tournaments = tResp.tournaments ?? [];

  const defaultLeague =
    tournaments.find((t: any) => t.is_default)?.league_code ??
    tournaments[0]?.league_code ??
    "eng.1";

  const league = searchParams?.league ?? defaultLeague;

  const gamesResp = await getSoccerGamesWithOdds(league).catch(() => ({ games: [] as any[] }));

  const selectedLabel =
    tournaments.find((t: any) => t.league_code === league)?.label ?? league;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white shadow-soft border border-slate-100 p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">Soccer</h1>
              <Badge variant="info">LIVE</Badge>
            </div>
            <p className="text-sm text-slate-600 mt-1">
              Selecciona una liga y consulta juegos con líneas (spread + total).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <LeaguePicker basePath="/soccer" tournaments={tournaments} league={league} />
            <Link
              href={`/soccer-picks?league=${encodeURIComponent(league)}`}
              className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Ver Picks IA
            </Link>
          </div>
        </div>

        <div className="mt-4 text-sm text-slate-600">
          Liga seleccionada: <span className="font-medium text-slate-900">{selectedLabel}</span>
        </div>
      </div>

      <GamesTable
        title="Juegos con odds (Soccer)"
        games={gamesResp.games ?? []}
        league="soccer"
        soccerLeagueCode={league}
      />

      <div className="rounded-2xl border border-slate-100 bg-white p-5 text-sm text-slate-700 shadow-soft">
        <p className="font-medium">Nota</p>
        <p className="mt-1 text-slate-600">
          Las predicciones son probabilísticas y se basan en datos/odds disponibles. Úsalas como apoyo, valida
          líneas con tu casa de apuestas y administra tu riesgo.
        </p>
      </div>
    </div>
  );
}
