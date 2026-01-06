import { DemoPick } from "@/lib/picks-demo";
import { Badge } from "@/components/ui/badge";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

export function PickCard({ pick }: { pick: DemoPick }) {
  const tone = pick.confidence >= 0.62 ? "good" : pick.confidence >= 0.54 ? "info" : "warn";

  return (
    <div className="rounded-2xl bg-white shadow-soft border border-slate-100 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs text-slate-500">PICK • {pick.league}</div>
          <div className="mt-1 text-lg font-semibold">{pick.matchup}</div>
          <div className="mt-1 text-sm text-slate-600">{pick.book}</div>
        </div>
        <Badge variant={tone}>
          Edge {pick.edge.toFixed(1)}
        </Badge>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
          <div className="text-xs text-slate-500">Selección</div>
          <div className="mt-1 font-semibold">{pick.selection}</div>
          <div className="mt-1 text-xs text-slate-500">{pick.market}</div>
        </div>
        <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
          <div className="text-xs text-slate-500">Confianza (demo)</div>
          <div className="mt-1 font-semibold">{Math.round(pick.confidence * 100)}%</div>
          <div className="mt-1 text-xs text-slate-500">Stake sugerido: {pick.stake}u</div>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-slate-100 bg-white p-3">
        <div className="text-xs text-slate-500">Razonamiento (placeholder)</div>
        <div className="mt-1 text-sm text-slate-700">
          Diferencial estimado vs línea (edge) + ajuste por total/spread. Integrar modelo real para explicación.
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="text-xs text-slate-500 font-mono">event_id: {pick.event_id}</div>
        <Link href="/reports" className="text-sm text-teal-700 hover:text-teal-800 inline-flex items-center gap-1">
          Ver contrato API <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
