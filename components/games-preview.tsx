import { GameRow } from "@/lib/wspm-types";
import { Badge } from "@/components/ui/badge";

export function GamesPreview({
  title,
  date,
  games,
  note
}: {
  title: string;
  date: string;
  games: GameRow[];
  note?: string;
}) {
  return (
    <div className="rounded-2xl bg-white shadow-soft border border-slate-100 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="text-sm text-slate-600 mt-1">Fecha {date}. {games.length} juegos.</p>
        </div>
        <Badge variant="info">GET</Badge>
      </div>

      {note ? (
        <div className="mt-4 rounded-xl border border-rose-100 bg-rose-50 p-3 text-sm text-rose-800">
          {note}
        </div>
      ) : null}

      <div className="mt-4 overflow-auto">
        <table className="w-full text-sm">
          <thead className="text-slate-500">
            <tr>
              <th className="text-left font-medium py-2 pr-2">Matchup</th>
              <th className="text-left font-medium py-2 pr-2">Spread</th>
              <th className="text-left font-medium py-2 pr-2">Total</th>
              <th className="text-left font-medium py-2 pr-2">Book</th>
            </tr>
          </thead>
          <tbody>
            {games.slice(0, 8).map((g) => (
              <tr key={g.event_id} className="border-t border-slate-100">
                <td className="py-2 pr-2">{g.matchup}</td>
                <td className="py-2 pr-2 text-slate-700">{g.odds?.details ?? "—"}</td>
                <td className="py-2 pr-2 text-slate-700">{g.odds?.over_under ?? "—"}</td>
                <td className="py-2 pr-2 text-slate-500">{g.odds?.provider ?? "—"}</td>
              </tr>
            ))}
            {games.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-6 text-center text-slate-500">
                  Sin datos. Revisa el backend o la fecha.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
