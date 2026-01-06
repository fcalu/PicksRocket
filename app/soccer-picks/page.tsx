import Link from "next/link";
import { LeaguePicker } from "@/components/soccer/league-picker";
import { Badge } from "@/components/ui/badge";
import { TeamLogo } from "@/components/team-logo";
import { getSoccerTournaments } from "@/lib/wspm";

type AiPick = {
  sport: "soccer";
  league: string;
  league_code: string;
  event_id: string;
  matchup: string;
  home_team: { name: string; abbr: string };
  away_team: { name: string; abbr: string };

  market: "TOTAL_25" | "BTTS" | "1X2" | "DOUBLE_CHANCE";
  pick: string;
  confidence: "Alta" | "Media" | "Baja";
  prob: number;
  edge_pct?: number | null;
  note?: string;
};

function marketLabel(m: AiPick["market"]) {
  switch (m) {
    case "TOTAL_25":
      return "Total (2.5)";
    case "BTTS":
      return "AA (Ambos anotan)";
    case "1X2":
      return "Ganador (1X2)";
    case "DOUBLE_CHANCE":
      return "Doble oportunidad";
  }
}

function marketBadgeVariant(m: AiPick["market"]): "info" | "good" | "warn" {
  switch (m) {
    case "DOUBLE_CHANCE":
      return "good";
    case "TOTAL_25":
      return "info";
    case "BTTS":
      return "warn";
    default:
      return "info";
  }
}

function confidenceVariant(c: AiPick["confidence"]): "info" | "good" | "warn" {
  if (c === "Alta") return "good";
  if (c === "Media") return "warn";
  return "info";
}

export default async function SoccerPicksPage({
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

  const res = await fetch(`${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/api/wspm/soccer/ai-picks?league=${encodeURIComponent(league)}`, {
    // This page is server-rendered; no-store so the user sees fresh picks.
    cache: "no-store",
  }).catch(() => null);

  const data = res ? await res.json().catch(() => null) : null;
  const picks: AiPick[] = data?.picks ?? [];
  const note: string | undefined = data?.note;

  const selectedLabel =
    tournaments.find((t: any) => t.league_code === league)?.label ?? league;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white shadow-soft border border-slate-100 p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Picks IA · Soccer</h1>
            <p className="text-sm text-slate-600 mt-1">
              6 selecciones priorizando mercados creíbles: Over/Under 2.5, AA y Ganador (más Doble oportunidad).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <LeaguePicker basePath="/soccer-picks" tournaments={tournaments} league={league} />
            <Link
              href={`/soccer?league=${encodeURIComponent(league)}`}
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
            >
              Ver Juegos
            </Link>
          </div>
        </div>

        <div className="mt-4 text-sm text-slate-600">
          Liga seleccionada: <span className="font-medium text-slate-900">{selectedLabel}</span>
        </div>
      </div>

      <section className="rounded-2xl bg-white shadow-soft border border-slate-100 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Top 6 Picks</h2>
            {note ? <p className="text-sm text-slate-600 mt-1">{note}</p> : null}
          </div>
          <Badge variant="info">Soccer</Badge>
        </div>

        <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
          {picks.map((p) => (
            <div
              key={`${p.event_id}-${p.market}-${p.pick}`}
              className="rounded-2xl border border-slate-100 bg-slate-50/30 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant={marketBadgeVariant(p.market)}>{marketLabel(p.market)}</Badge>
                    <Badge variant={confidenceVariant(p.confidence)}>Confianza {p.confidence}</Badge>
                    <span className="text-xs text-slate-500">
                      Prob {Math.round((p.prob ?? 0) * 100)}%
                    </span>
                  </div>

                  <div className="mt-2 flex items-center gap-2">
                    <TeamLogo
                      league="soccer"
                      abbr={p.away_team?.abbr ?? ""}
                      name={p.away_team?.name ?? null}
                      size={30}
                      soccerLeagueCode={league}
                    />
                    <div className="text-sm font-semibold text-slate-900 truncate">
                      {p.away_team?.abbr ?? ""} @ {p.home_team?.abbr ?? ""}
                    </div>
                    <TeamLogo
                      league="soccer"
                      abbr={p.home_team?.abbr ?? ""}
                      name={p.home_team?.name ?? null}
                      size={30}
                      soccerLeagueCode={league}
                    />
                  </div>

                  <div className="mt-2 text-sm text-slate-700">
                    <span className="font-semibold">Pick:</span> {p.pick}
                  </div>

                  {p.note ? (
                    <div className="mt-2 text-xs text-slate-500 leading-relaxed">{p.note}</div>
                  ) : null}
                </div>

                <div className="text-right shrink-0">
                  <div className="font-mono text-xs text-slate-500">{p.event_id}</div>
                </div>
              </div>
            </div>
          ))}

          {picks.length === 0 ? (
            <div className="col-span-full rounded-xl border border-slate-100 bg-white p-4 text-sm text-slate-600">
              No se pudieron generar picks para esta liga (o no hay juegos disponibles). Intenta otra liga.
            </div>
          ) : null}
        </div>
      </section>

      <div className="rounded-2xl border border-slate-100 bg-white p-5 text-sm text-slate-700 shadow-soft">
        <p className="font-medium">Responsabilidad</p>
        <p className="mt-1 text-slate-600">
          Estas selecciones son orientativas y no garantizan resultados. La varianza en soccer es alta (goles
          escasos, roja/penal pueden cambiar el guion). Usa stake responsable.
        </p>
      </div>
    </div>
  );
}
