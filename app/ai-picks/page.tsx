"use client";

import { useMemo, useState } from "react";
import { SPORT_CONFIG, type SportKey } from "@/lib/wspm-config";
import { TeamLogo } from "@/components/team-logo";
import { tierEmoji } from "@/lib/wspm-math";

type AiPick = {
  matchup: string;
  event_id: string;
  provider?: string | null;
  details?: string | null;
  over_under?: number | null;
  team: string;
  opp: string;
  athlete_id: string;
  player_name: string;
  position: string;
  market_type: string;
  book_line: number;
  wspm_projection: number;
  edge: number;
  direction: "OVER" | "UNDER";
  margin_abs: number;
  margin_pct: number;
  prob_cover: number;
  confidence: string;
  tier: string;
  safety_margin_pct?: number;
  raw?: any;
};

function yyyymmddFromIso(iso: string) {
  return iso.replaceAll("-", "");
}

function formatMarket(m: string) {
  return (m ?? "").replaceAll("_", " ");
}

export default function AiPicksPage() {
  const [sport, setSport] = useState<SportKey>("NBA");

  const [season, setSeason] = useState<number>(SPORT_CONFIG[sport].default_season);
  const [week, setWeek] = useState<number>(SPORT_CONFIG[sport].default_week);
  const [seasonType, setSeasonType] = useState<number>(SPORT_CONFIG[sport].default_season_type);

  const [dateIso, setDateIso] = useState<string>(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  });

  const [maxGames, setMaxGames] = useState<number>(6);

  // lines override (optional)
  const [lines, setLines] = useState<Record<string, number>>(() => ({
    ...SPORT_CONFIG["NFL"].default_lines,
    ...SPORT_CONFIG["NBA"].default_lines,
  }));

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string>("");
  const [picks, setPicks] = useState<AiPick[]>([]);
  const [diagnostics, setDiagnostics] = useState<any>(null);
  const [assumptions, setAssumptions] = useState<any>(null);

  const prefix = useMemo(() => SPORT_CONFIG[sport].api_prefix, [sport]);
  const league = useMemo(() => SPORT_CONFIG[sport].api_prefix as "nfl" | "nba", [sport]);

  const overridesForSport = useMemo(() => {
    // Only send relevant markets for the chosen sport
    const cfgLines = SPORT_CONFIG[sport].default_lines;
    const out: Record<string, number> = {};
    Object.keys(cfgLines).forEach((k) => {
      out[k] = Number(lines[k] ?? cfgLines[k]);
    });
    return out;
  }, [lines, sport]);

  async function generate() {
    setLoading(true);
    setErr("");
    setPicks([]);
    setDiagnostics(null);
    setAssumptions(null);

    const body: any =
      sport === "NFL"
        ? {
            season,
            season_type: seasonType,
            week,
            max_games: maxGames,
            picks_count: 6,
            lines_override: overridesForSport,
          }
        : {
            season,
            season_type: seasonType,
            week,
            date: yyyymmddFromIso(dateIso),
            max_games: maxGames,
            picks_count: 6,
            lines_override: overridesForSport,
          };

    try {
      const res = await fetch(`/api/wspm/${prefix}/ai-picks`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const text = await res.text();
      if (!res.ok) throw new Error(text);
      const json = JSON.parse(text);
      setPicks((json?.picks ?? []) as AiPick[]);
      setDiagnostics(json?.diagnostics ?? null);
      setAssumptions(json?.assumptions ?? null);
    } catch (e: any) {
      setErr(String(e?.message ?? e));
    } finally {
      setLoading(false);
    }
  }

  // Simple parlay builder (naive independence assumption)
  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({});

  const selectedPicks = useMemo(() => {
    return picks.filter((p) => selectedIds[p.athlete_id + ":" + p.market_type]);
  }, [picks, selectedIds]);

  const parlayProb = useMemo(() => {
    if (!selectedPicks.length) return null;
    const prod = selectedPicks.reduce((acc, p) => acc * Math.max(0.5, Math.min(0.8, (p.prob_cover ?? 50) / 100)), 1);
    return prod * 100;
  }, [selectedPicks]);

  const ticketText = useMemo(() => {
    if (!selectedPicks.length) return "";
    return selectedPicks
      .map((p, idx) => {
        return `${idx + 1}) ${p.player_name} (${p.team}) ${formatMarket(p.market_type)}: ${p.direction} ${Number(p.book_line).toFixed(1)} | Proy ${Number(p.wspm_projection).toFixed(1)} | Tier ${p.tier}`;
      })
      .join("\n");
  }, [selectedPicks]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">AI Picks</h1>
          <p className="text-sm text-slate-600 mt-1">
            Genera automáticamente <span className="font-semibold">6 picks recomendados</span> usando tu backend motor
            (games-with-odds → roster → auto-projection-report).
          </p>
        </div>

        <div className="flex gap-2">
          {(["NBA", "NFL"] as SportKey[]).map((s) => (
            <button
              key={s}
              onClick={() => setSport(s)}
              className={`h-10 px-4 rounded-xl border text-sm font-medium transition-colors ${
                sport === s ? "bg-teal-50 border-teal-200 text-teal-900" : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
              }`}
            >
              {SPORT_CONFIG[s].emoji} {s}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl bg-white shadow-soft border border-slate-100 p-5 space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-2">
            {sport === "NFL" ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <div className="text-xs uppercase tracking-wide text-slate-500">Season</div>
                  <input
                    type="number"
                    value={season}
                    onChange={(e) => setSeason(Number(e.target.value))}
                    className="mt-2 w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-sm"
                  />
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-slate-500">Week</div>
                  <input
                    type="number"
                    value={week}
                    onChange={(e) => setWeek(Number(e.target.value))}
                    className="mt-2 w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-sm"
                  />
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-slate-500">Season Type</div>
                  <select
                    value={seasonType}
                    onChange={(e) => setSeasonType(Number(e.target.value))}
                    className="mt-2 w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-sm"
                  >
                    <option value={1}>Preseason (1)</option>
                    <option value={2}>Regular (2)</option>
                    <option value={3}>Postseason (3)</option>
                  </select>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="text-xs uppercase tracking-wide text-slate-500">Date (NBA)</div>
                  <input
                    type="date"
                    value={dateIso}
                    onChange={(e) => setDateIso(e.target.value)}
                    className="mt-2 w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-sm"
                  />
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-slate-500">Season (year)</div>
                  <input
                    type="number"
                    value={season}
                    onChange={(e) => setSeason(Number(e.target.value))}
                    className="mt-2 w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-sm"
                  />
                </div>
              </div>
            )}
          </div>

          <div>
            <div className="text-xs uppercase tracking-wide text-slate-500">Max games to scan</div>
            <input
              type="number"
              min={0}
              value={maxGames}
              onChange={(e) => setMaxGames(Number(e.target.value))}
              className="mt-2 w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-sm"
            />
            <div className="mt-2 text-xs text-slate-500">0 = todos (puede tardar más)</div>
          </div>

          <div className="flex flex-col justify-end">
            <button
              onClick={generate}
              disabled={loading}
              className="h-10 px-4 rounded-xl bg-slate-900 text-white text-sm font-medium disabled:opacity-60"
            >
              {loading ? "Generando..." : "Generar 6 picks"}
            </button>
            <div className="mt-2 text-xs text-slate-500">
              Recomendación: empieza con 4–6 juegos para no saturar el backend.
            </div>
          </div>
        </div>

        <details className="rounded-xl border border-slate-100 bg-slate-50 p-4">
          <summary className="cursor-pointer text-sm font-medium text-slate-900">Ajustes avanzados (líneas por defecto)</summary>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {Object.entries(SPORT_CONFIG[sport].default_lines).map(([k, v]) => (
              <div key={k}>
                <div className="text-xs uppercase tracking-wide text-slate-500">{formatMarket(k)}</div>
                <input
                  type="number"
                  step="0.5"
                  value={Number(lines[k] ?? v)}
                  onChange={(e) => setLines((prev) => ({ ...prev, [k]: Number(e.target.value) }))}
                  className="mt-2 w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-sm"
                />
              </div>
            ))}
          </div>
          <div className="mt-3 text-xs text-slate-600">
            Nota: para “props” reales, lo ideal es integrar líneas reales del book; mientras tanto, aquí controlas el baseline.
          </div>
        </details>

        {err ? (
          <div className="rounded-xl border border-rose-100 bg-rose-50 p-3 text-sm text-rose-800">Error: {err}</div>
        ) : null}

        {diagnostics ? (
          <div className="rounded-xl border border-slate-100 bg-white p-3 text-xs text-slate-600">
            <span className="font-medium text-slate-900">Diagnóstico:</span>{" "}
            games {diagnostics.games}, candidates {diagnostics.candidates}, ok {diagnostics.projections_ok}, errors{" "}
            {diagnostics.errors}
          </div>
        ) : null}

        {assumptions?.note ? (
          <div className="rounded-xl border border-amber-100 bg-amber-50 p-3 text-sm text-amber-900">{assumptions.note}</div>
        ) : null}

        <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs text-slate-600">
          Importante: esto es un modelo estadístico; no hay garantía de acierto. Úsalo como apoyo y gestiona tu riesgo.
        </div>
      </div>

      {picks.length ? (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="xl:col-span-2 space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {picks.map((p, idx) => {
                const key = p.athlete_id + ":" + p.market_type;
                const checked = !!selectedIds[key];

                return (
                  <div key={key} className="rounded-2xl bg-white shadow-soft border border-slate-100 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-xs text-slate-500">Pick #{idx + 1}</div>
                        <div className="mt-1 text-lg font-semibold">
                          {tierEmoji(p.tier)} {p.tier} • {p.player_name}
                        </div>
                        <div className="mt-1 text-sm text-slate-600">
                          {/* Teams */}
                          <span className="inline-flex items-center gap-2">
                            <TeamLogo league={league} abbr={p.team} size={22} />
                            <span className="font-medium">{p.team}</span>
                            <span className="text-slate-400">vs</span>
                            <TeamLogo league={league} abbr={p.opp} size={22} />
                            <span className="font-medium">{p.opp}</span>
                            <span className="text-slate-400">•</span>
                            <span>{p.matchup}</span>
                          </span>
                        </div>
                      </div>

                      <label className="flex items-center gap-2 text-sm text-slate-700">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => setSelectedIds((prev) => ({ ...prev, [key]: e.target.checked }))}
                        />
                        Parlay
                      </label>
                    </div>

                    <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-3">
                      <div className="text-sm font-semibold">
                        {p.direction} {Number(p.book_line).toFixed(1)} • {formatMarket(p.market_type)}
                      </div>
                      <div className="mt-1 text-sm text-slate-600">
                        Proy motor: <span className="font-semibold">{Number(p.wspm_projection).toFixed(1)}</span> • Edge:{" "}
                        <span className="font-semibold">{p.edge >= 0 ? "+" : ""}{Number(p.edge).toFixed(1)}</span>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="rounded-xl border border-slate-100 bg-white p-3">
                        <div className="text-xs text-slate-500">Margen %</div>
                        <div className="mt-1 font-semibold">{Number(p.margin_pct).toFixed(1)}%</div>
                      </div>
                      <div className="rounded-xl border border-slate-100 bg-white p-3">
                        <div className="text-xs text-slate-500">P(cubrir)</div>
                        <div className="mt-1 font-semibold">{Number(p.prob_cover).toFixed(1)}%</div>
                      </div>
                      <div className="rounded-xl border border-slate-100 bg-white p-3">
                        <div className="text-xs text-slate-500">Confianza</div>
                        <div className="mt-1 font-semibold">{p.confidence}</div>
                      </div>
                      <div className="rounded-xl border border-slate-100 bg-white p-3">
                        <div className="text-xs text-slate-500">Prop</div>
                        <div className="mt-1 font-semibold">{p.position || "—"}</div>
                      </div>
                    </div>

                    <div className="mt-4 text-xs text-slate-600">
                      {p.provider ? (
                        <span>
                          Odds juego: <span className="font-medium">{p.provider}</span> • {p.details ?? "—"} • O/U{" "}
                          {p.over_under ?? "—"}
                        </span>
                      ) : (
                        <span>Odds juego: —</span>
                      )}
                    </div>

                    <details className="mt-4">
                      <summary className="cursor-pointer text-sm font-medium text-slate-900">Ver JSON (debug)</summary>
                      <pre className="mt-2 text-xs overflow-auto max-h-[260px] bg-slate-50 border border-slate-100 rounded-xl p-3">
                        {JSON.stringify(p.raw ?? {}, null, 2)}
                      </pre>
                    </details>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl bg-white shadow-soft border border-slate-100 p-5">
              <div className="text-lg font-semibold">Parlay Builder</div>
              <div className="mt-1 text-sm text-slate-600">Selecciona picks y genera tu “ticket”.</div>

              <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-3">
                <div className="text-xs text-slate-500">Picks seleccionados</div>
                <div className="mt-1 font-semibold">{selectedPicks.length}</div>
                <div className="mt-2 text-xs text-slate-600">
                  Probabilidad combinada (naive):{" "}
                  <span className="font-semibold">{parlayProb != null ? `${parlayProb.toFixed(1)}%` : "—"}</span>
                </div>
                <div className="mt-2 text-[11px] text-slate-500">
                  Nota: multiplicación asume independencia (no siempre es cierto). Es solo referencia.
                </div>
              </div>

              <div className="mt-4">
                <div className="text-xs uppercase tracking-wide text-slate-500">Ticket (copiar)</div>
                <pre className="mt-2 whitespace-pre-wrap text-sm bg-slate-50 border border-slate-100 rounded-xl p-3 min-h-[120px]">
                  {ticketText || "Selecciona 1+ picks para generar el ticket."}
                </pre>
              </div>
            </div>

            <div className="rounded-2xl bg-white shadow-soft border border-slate-100 p-5">
              <div className="text-sm font-semibold">Diferenciadores “premium” (roadmap)</div>
              <ul className="mt-3 text-sm text-slate-700 space-y-2 list-disc pl-5">
                <li>Ingreso de líneas reales (Playdoit/DK/FD) y recalcular picks en tiempo real.</li>
                <li>Backtesting por jugador/mercado + tracking (ROI, hit rate, streaks).</li>
                <li>Alertas: “line moved”, “player out”, “pace change”, “injury impact”.</li>
                <li>Recomendación por perfil de riesgo (Conservador/Balanceado/Aggro).</li>
              </ul>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
