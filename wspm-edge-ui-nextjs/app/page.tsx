import { StatCard } from "@/components/stat-card";
import { GamesPreview } from "@/components/games-preview";
import { getHealth, getNbaGamesWithOdds, yyyymmddToday } from "@/lib/wspm";

export default async function DashboardPage() {
  const date = yyyymmddToday();
  const health = await getHealth().catch((e) => ({ ok: false, error: String(e) } as const));
  const nba = await getNbaGamesWithOdds(date).catch((e) => ({ games: [], error: String(e) }));

  const apiStatus = health.ok ? "OK" : "DOWN";
  const latency = health.ok ? `${health.ms} ms` : "—";
  const gamesCount = Array.isArray(nba.games) ? nba.games.length : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-slate-600">
          Vista general. Datos en vivo desde tu backend: <span className="font-medium">NBA</span> • fecha {date}.
        </p>
      </div>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="API Status" value={apiStatus} subtitle={health.ok ? "Health check OK" : "Puede estar dormido (Render)"} tone={health.ok ? "good" : "bad"} />
        <StatCard title="Latencia" value={latency} subtitle={health.ok ? "Medido en /api/v1/health" : "Reintenta en 30–60s"} />
        <StatCard title="Juegos NBA (odds)" value={`${gamesCount}`} subtitle="Desde /api/v1/nba/games-with-odds" />
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <GamesPreview title="NBA • Juegos de hoy" date={date} games={nba.games ?? []} note={nba.error ? `Error: ${nba.error}` : undefined} />
        <div className="rounded-2xl bg-white shadow-soft border border-slate-100 p-5">
          <h2 className="text-lg font-semibold">¿Qué sigue?</h2>
          <p className="text-sm text-slate-600 mt-2">
            Esta UI ya está lista para integrar tus endpoints de proyección (POST). En esta fase mostramos:
          </p>
          <ul className="mt-3 space-y-2 text-sm text-slate-700 list-disc pl-5">
            <li>Listado de juegos con odds (GET)</li>
            <li>Picks demo (derivados de odds) con cards estilo “fintech”</li>
            <li>Viewer de OpenAPI para validar contrato</li>
          </ul>
          <div className="mt-4 rounded-xl bg-slate-50 border border-slate-100 p-4 text-sm text-slate-700">
            Para integrar picks reales, lo único que falta es confirmar el payload de tus endpoints POST (game-projection / auto-projection-report).
          </div>
        </div>
      </section>
    </div>
  );
}
