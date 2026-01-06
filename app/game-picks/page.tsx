"use client";

import { useEffect, useMemo, useState } from "react";
import { ShieldCheck, Sparkles, RefreshCw } from "lucide-react";

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
  games: any[];
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

export default function GamePicksPage() {
  const [date, setDate] = useState(() => yyyymmdd(new Date()));
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  async function saveTop6() {
    if (!data?.top6?.length) return;
    setSavedMsg(null);
    try {
      const r = await fetch("/api/picks/save", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ sport: "nba", date: data.date, picks: data.top6 }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || "No se pudo guardar");
      setSavedMsg(`Guardado: ${j.created} picks`);
    } catch (e: any) {
      setSavedMsg(e?.message || "Error al guardar");
    }
  }

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
      if (!r.ok) throw new Error(j?.error || "Error al generar predicciones");
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

  const dateInput = useMemo(() => {
    // Convert YYYYMMDD -> YYYY-MM-DD
    return `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}`;
  }, [date]);

  return (
    <div className="px-4 md:px-8 py-6 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Predicciones (NBA)</h1>
        <p className="text-slate-600 text-sm">
          6 picks recomendados (Spread/Total) generados por el motor motor + proyección de equipo (beta).
        </p>
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

        <div className="sm:ml-auto flex items-center gap-2 text-xs text-slate-500">
          <ShieldCheck className="h-4 w-4" />
          Transparencia: mostramos diferencia vs línea y nivel de confianza.
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-900 text-sm">
          {error}
        </div>
      )}

      {!data && !error && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
          Cargando predicciones…
        </div>
      )}

      {data && (
        <>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold flex items-center gap-2">
                <Sparkles className="h-4 w-4" /> Top 6 Picks recomendados
              </div>
              <div className="flex items-center gap-2">
              <div className="text-xs text-slate-500">Fecha {data.date}</div>
              <button
                onClick={saveTop6}
                className="h-8 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-medium"
              >
                Guardar en historial
              </button>
            </div>
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

            {savedMsg && (
              <div className="mt-3 text-xs text-slate-600">{savedMsg}</div>
            )}

            {data.note && (
              <div className="mt-4 text-xs text-slate-500">{data.note}</div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="text-sm font-semibold">Por partido</div>
            <div className="mt-4 space-y-4">
              {data.games.map((g) => (
                <div key={g.event_id} className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                    <div>
                      <div className="font-semibold">{g.matchup}</div>
                      <div className="text-xs text-slate-500">
                        {g.odds?.provider ? `${g.odds.provider} · ` : ""}
                        {g.odds?.details ?? "Sin spread"} · O/U {g.odds?.over_under ?? "N/A"}
                      </div>
                    </div>
                    <div className="text-xs text-slate-500">
                      Proy: Home {g.model?.projected_home?.toFixed?.(1)} · Away {g.model?.projected_away?.toFixed?.(1)} · Total{" "}
                      {g.model?.projected_total?.toFixed?.(1)}
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-medium text-slate-700">Spread</div>
                        {g.spreadPick?.confidence && <span className={confidencePill(g.spreadPick.confidence)}>{g.spreadPick.confidence}</span>}
                      </div>
                      <div className="mt-1 text-base font-semibold">{g.spreadPick?.label ?? "N/A"}</div>
                      {g.spreadPick?.diff !== undefined && (
                        <div className="mt-1 text-xs text-slate-500">Diff: {Number(g.spreadPick.diff).toFixed(2)}</div>
                      )}
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-medium text-slate-700">Total</div>
                        {g.totalPick?.confidence && <span className={confidencePill(g.totalPick.confidence)}>{g.totalPick.confidence}</span>}
                      </div>
                      <div className="mt-1 text-base font-semibold">{g.totalPick?.label ?? "N/A"}</div>
                      {g.totalPick?.diff !== undefined && (
                        <div className="mt-1 text-xs text-slate-500">Diff: {Number(g.totalPick.diff).toFixed(2)}</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
