import { PicksGrid } from "@/components/picks-grid";
import { getNbaGamesWithOdds, yyyymmddToday } from "@/lib/wspm";

export default async function PicksPage() {
  const date = yyyymmddToday();
  const nba = await getNbaGamesWithOdds(date).catch((e) => ({ games: [], error: String(e) }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Picks</h1>
        <p className="text-sm text-slate-600 mt-1">
          Picks demo derivados de odds (UI lista para conectar proyecciones reales). Fecha {date}.
        </p>
      </div>

      <PicksGrid games={nba.games ?? []} note={nba.error ? `Error al cargar juegos: ${nba.error}` : undefined} />
    </div>
  );
}
