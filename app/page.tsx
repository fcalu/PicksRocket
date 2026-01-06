import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StatCard } from "@/components/stat-card";
import { GamesTable } from "@/components/games-table";
import { getHealth, getSoccerTournaments, getSoccerGamesWithOdds } from "@/lib/wspm";
import { firstAvailableGamesByDate, nflFallbackByWeek } from "@/lib/upcoming";

export const runtime = "nodejs";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  // Logged-out: simple landing / CTA
  if (!session?.user) {
    return (
      <div className="space-y-8">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">PicksRocket</h1>
          <p className="mt-2 text-slate-600 max-w-2xl">
            Plataforma de análisis de apuestas con picks asistidos por modelo: NFL, NBA y Soccer.
            Inicia sesión para ver partidos próximos, picks recomendados e historial.
          </p>
          <div className="mt-6 flex gap-3">
            <Link
              href="/login"
              className="h-11 px-5 rounded-2xl bg-slate-900 text-white hover:bg-slate-800 inline-flex items-center"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/games"
              className="h-11 px-5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 inline-flex items-center"
            >
              Ver juegos
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const userId = (session as any).user?.id as string | undefined;

  const [health, nbaNext, nflNextTry, tournaments] = await Promise.all([
    getHealth().catch(() => ({ ok: false, ms: 0 } as const)),
    firstAvailableGamesByDate("nba", 7).catch(() => ({ date: "", games: [], note: "" })),
    firstAvailableGamesByDate("nfl", 14).catch(() => ({ date: "", games: [], note: "" })),
    getSoccerTournaments().catch(() => ({ tournaments: [] })),
  ]);

  const defaultLeague =
    tournaments.tournaments.find((t) => t.is_default)?.league_code ||
    tournaments.tournaments[0]?.league_code ||
    "eng.1";

  const soccer = await getSoccerGamesWithOdds(defaultLeague).catch(() => ({ games: [] }));

  // NFL fallback if date endpoint returns empty
  let nfl = nflNextTry;
  let nflNote = nflNextTry.note;
  if (!nfl.games?.length) {
    const fb = await nflFallbackByWeek();
    nfl = { date: nflNextTry.date, games: fb.games, note: fb.note ?? nflNextTry.note };
    nflNote = nfl.note;
  }

  const picksCount = userId
    ? await prisma.pick.count({ where: { userId } }).catch(() => 0)
    : 0;

  const lastPicks = userId
    ? await prisma.pick.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 8 }).catch(() => [])
    : [];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
          Bienvenido, {session.user?.name ?? ""}
        </h1>
        <p className="text-sm text-slate-600">
          Aquí tienes los próximos partidos disponibles y un resumen rápido de tu actividad.
        </p>
      </div>

      <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Estado API"
          value={health.ok ? "OK" : "DOWN"}
          subtitle={health.ok ? "Backend disponible" : "Si usas Render, puede estar dormido"}
          tone={health.ok ? "good" : "bad"}
        />
        <StatCard title="Latencia" value={health.ok ? `${health.ms} ms` : "—"} subtitle="Medido en /api/v1/health" />
        <StatCard title="Tus picks guardados" value={`${picksCount}`} subtitle="Historial personal" />
        <StatCard title="Acciones" value="Listo" subtitle="Explora juegos y picks" />
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <GamesTable
          league="nba"
          title={`NBA • Próximos juegos (fecha ${nbaNext.date || "—"})`}
          games={(nbaNext.games ?? []).slice(0, 6)}
          error={nbaNext.note}
        />
        <GamesTable
          league="nfl"
          title={`NFL • Próximos juegos (${nfl.date || "—"})`}
          games={(nfl.games ?? []).slice(0, 6)}
          error={nflNote}
        />
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <GamesTable
          league="soccer"
          soccerLeagueCode={defaultLeague}
          title={`Soccer • Próximos juegos (${defaultLeague})`}
          games={(soccer.games ?? []).slice(0, 6) as any}
        />
        <div className="rounded-2xl bg-white shadow-soft border border-slate-100 p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Actividad reciente</h2>
              <p className="text-sm text-slate-600 mt-1">Tus últimos picks guardados.</p>
            </div>
            <Link href="/history" className="text-sm text-teal-700 hover:text-teal-800 font-medium">
              Ver historial
            </Link>
          </div>

          {lastPicks.length === 0 ? (
            <div className="mt-4 text-sm text-slate-600">
              Aún no tienes picks guardados. Ve a <Link className="text-teal-700 font-medium" href="/ai-picks">AI Picks</Link> o{" "}
              <Link className="text-teal-700 font-medium" href="/soccer-picks">Soccer Picks</Link>.
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {lastPicks.map((p) => (
                <div key={p.id} className="rounded-xl border border-slate-200 bg-white p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-slate-800 truncate">
                        {p.matchup ?? "Pick"} • {p.sport.toUpperCase()}
                      </div>
                      <div className="text-xs text-slate-600 mt-0.5">
                        {p.market} • {p.pick} • Confianza {p.confidence}
                      </div>
                    </div>
                    <div className="text-xs text-slate-500 whitespace-nowrap">
                      {new Date(p.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
