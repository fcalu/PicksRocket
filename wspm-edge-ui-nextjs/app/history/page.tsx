import { PlaceholderPanel } from "@/components/placeholder-panel";

export default function HistoryPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Historial</h1>
        <p className="text-sm text-slate-600 mt-1">
          En la fase 2 se conecta una base de datos (Supabase/Postgres) para ROI, unidades, rachas y CLV.
        </p>
      </div>
      <PlaceholderPanel />
    </div>
  );
}
