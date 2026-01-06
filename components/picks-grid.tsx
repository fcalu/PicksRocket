import { GameRow } from "@/lib/wspm-types";
import { buildPicks } from "@/lib/picks-demo";
import { PickCard } from "@/components/pick-card";

export function PicksGrid({ games, note }: { games: GameRow[]; note?: string }) {
  const picks = buildPicks(games).slice(0, 8);

  return (
    <section className="space-y-4">
      {note ? (
        <div className="rounded-2xl border border-rose-100 bg-rose-50 p-4 text-sm text-rose-800">
          {note}
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {picks.map((p) => (
          <PickCard key={`${p.event_id}-${p.market}-${p.selection}`} pick={p} />
        ))}
      </div>

      <div className="rounded-2xl bg-white shadow-soft border border-slate-100 p-5">
        <div className="text-sm text-slate-600">
          Nota: estos picks son <span className="font-medium"></span>. La UI está lista para sustituirlos por
          proyecciones reales cuando conectemos tus endpoints POST (game-projection / auto-projection-report).
        </div>
      </div>
    </section>
  );
}
