"use client";

import { useEffect, useMemo, useState } from "react";
import { Sparkles, RefreshCw, ExternalLink } from "lucide-react";
import Link from "next/link";

type ApiResponse = {
  date: string;
  top6: Array<{
    type: "Spread" | "Total";
    label: string;
    confidence: string;
    diff: number;
    event_id: string;
    matchup: string;
  }>;
  note?: string;
};

function yyyymmdd(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

function confidencePill(conf: string) {
  const base = "px-2 py-0.5 rounded-full text-xs border";
  if (conf === "Alta") return `${base} bg-emerald-50 text-emerald-800 border-emerald-200`;
  if (conf === "Media-Alta") return `${base} bg-teal-50 text-teal-800 border-teal-200`;
  if (conf === "Media") return `${base} bg-amber-50 text-amber-900 border-amber-200`;
  return `${base} bg-slate-50 text-slate-700 border-slate-200`;
}

export default function PicksPage() {
  const [date, setDate] = useState(() => yyyymmdd(new Date()));
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const dateInput = useMemo(() => `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}`, [date]);

  async function run() {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch("/api/wspm/nba/game-picks", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ date, max_games: 10, players_per_team: 8, bench_points: 28 }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || "Error al generar picks");
      setData(j);
    } catch (e: any) {
      setError(e?.message || "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="px-4 md:px-8 py-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Picks recomendados</h1>
          <p className="text-sm text-slate-600 mt-1">Top 6 (NBA) listo para apostar. Ajusta fecha y regenera.</p>
        </div>
        <Link
          href="/game-picks"
          className="h-10 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-sm font-medium inline-flex items-center gap-2"
        >
          Ver detalle <ExternalLink className="h-4 w-4" />
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
        <div>
          <label className="text-xs text-slate-500">Fecha</label>
          <input
            type="date"
            value={dateInput}
            onChange={(e) => setDate(e.target.value.replaceAll("-", ""))}
            className="mt-1 h-10 px-3 rounded-xl border border-slate-200 bg-white text-sm"
          />
        </div>
        <button
          onClick={run}
          disabled={loading}
          className="h-10 px-4 rounded-xl bg-slate-900 text-white hover:bg-slate-800 text-sm font-medium inline-flex items-center gap-2 disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Generar
        </button>
      </div>

      {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-900 text-sm">{error}</div>}

      {data && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold flex items-center gap-2">
              <Sparkles className="h-4 w-4" /> Top 6 Picks
            </div>
            <div className="text-xs text-slate-500">Fecha {data.date}</div>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {data.top6.map((p, idx) => (
              <div key={idx} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-xs font-medium text-slate-700">{p.type}</div>
                  <span className={confidencePill(p.confidence)}>{p.confidence}</span>
                </div>
                <div className="mt-2 text-lg font-semibold">{p.label}</div>
                <div className="mt-1 text-xs text-slate-600 truncate">{p.matchup}</div>
                <div className="mt-2 text-xs text-slate-500">
                  Diferencia vs línea: <span className="font-mono">{p.diff.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>

          {data.note && <div className="mt-4 text-xs text-slate-500">{data.note}</div>}
        </div>
      )}
    </div>
  );
}
