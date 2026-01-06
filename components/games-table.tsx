import { GameRow } from "@/lib/wspm-types";
import { Badge } from "@/components/ui/badge";
import { TeamLogo } from "@/components/team-logo";

export function GamesTable({
  title,
  games,
  league,
  error,
  soccerLeagueCode,
}: {
  title: string;
  games: GameRow[];
  league: "nfl" | "nba" | "soccer";
  error?: string;
  /** Only for soccer: league code like 'eng.1', 'esp.1', etc. */
  soccerLeagueCode?: string;
}) {
  return (
    <section className="rounded-2xl bg-white shadow-soft border border-slate-100 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="text-sm text-slate-600 mt-1">{games.length} juegos</p>
        </div>
        <Badge variant="info">GET</Badge>
      </div>

      {error ? (
        <div className="mt-4 rounded-xl border border-rose-100 bg-rose-50 p-3 text-sm text-rose-800">
          Error: {error}
        </div>
      ) : null}

      <div className="mt-4 overflow-auto">
        <table className="w-full text-sm">
          <thead className="text-slate-500">
            <tr>
              <th className="text-left font-medium py-2 pr-3">Matchup</th>
              <th className="text-left font-medium py-2 pr-3">Spread</th>
              <th className="text-left font-medium py-2 pr-3">Total</th>
              <th className="text-left font-medium py-2 pr-3">Book</th>
              <th className="text-left font-medium py-2 pr-3">Event ID</th>
            </tr>
          </thead>
          <tbody>
            {games.map((g) => (
              <tr key={g.event_id} className="border-t border-slate-100 hover:bg-slate-50/60">
                <td className="py-2 pr-3">
                  <div className="flex items-center gap-2">
                    <TeamLogo
                      league={league}
                      abbr={g.away_team?.abbr ?? ""}
                      name={g.away_team?.name ?? null}
                      size={26}
                      soccerLeagueCode={league === "soccer" ? soccerLeagueCode : undefined}
                    />
                    <span className="text-sm font-medium text-slate-800">{g.away_team?.abbr ?? ""}</span>
                    <span className="text-slate-400">vs</span>
                    <TeamLogo
                      league={league}
                      abbr={g.home_team?.abbr ?? ""}
                      name={g.home_team?.name ?? null}
                      size={26}
                      soccerLeagueCode={league === "soccer" ? soccerLeagueCode : undefined}
                    />
                    <span className="text-sm font-medium text-slate-800">{g.home_team?.abbr ?? ""}</span>
                    <span className="text-sm text-slate-600 ml-2">{g.matchup}</span>
                  </div>
                </td>
                <td className="py-2 pr-3 text-slate-700">{g.odds?.details ?? "—"}</td>
                <td className="py-2 pr-3 text-slate-700">{g.odds?.over_under ?? "—"}</td>
                <td className="py-2 pr-3 text-slate-500">{g.odds?.provider ?? "—"}</td>
                <td className="py-2 pr-3 font-mono text-xs text-slate-500">{g.event_id}</td>
              </tr>
            ))}
            {games.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-6 text-center text-slate-500">
                  Sin datos para este deporte/fecha.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}
