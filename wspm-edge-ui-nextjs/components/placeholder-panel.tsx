export function PlaceholderPanel() {
  return (
    <div className="rounded-2xl bg-white shadow-soft border border-slate-100 p-6">
      <div className="text-lg font-semibold">Historial / Performance</div>
      <p className="mt-2 text-sm text-slate-600">
        En monetización, el historial es lo que más vende (ROI, unidades, rachas, CLV). Aquí irán:
      </p>
      <ul className="mt-3 list-disc pl-5 text-sm text-slate-700 space-y-1">
        <li>Tabla de picks (fecha, mercado, línea, resultado)</li>
        <li>KPIs: ROI, Units, Win%, CLV</li>
        <li>Filtros por deporte/mercado</li>
      </ul>
      <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-700">
        Recomendación: Supabase (Auth + Postgres) para persistir picks y resultados.
      </div>
    </div>
  );
}
