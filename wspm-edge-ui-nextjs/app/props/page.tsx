"use client";

import { useEffect, useMemo, useState } from "react";
import { SPORT_CONFIG, type SportKey, findPlayerMarketType } from "@/lib/wspm-config";
import {
  computeDirectionAndMargin,
  classifyConfidenceFromMargin,
  estimateProbCover,
  tierEmoji,
} from "@/lib/wspm-math";
import { summarizeProjection } from "@/lib/wspm-normalize";

type GameRow = {
  event_id: string;
  matchup: string;
  home_team?: { abbr?: string; name?: string };
  away_team?: { abbr?: string; name?: string };
  odds?: { provider?: string; details?: string; over_under?: number | null };
};

type Roster = {
  players?: Array<{ athlete_id: string | number; name: string; position?: string | null }>;
};

function yyyymmdd(d: string) {
  return d.replaceAll("-", "");
}

export default function PropsPage() {
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

  const [games, setGames] = useState<GameRow[]>([]);
  const [gamesErr, setGamesErr] = useState<string>("");
  const [loadingGames, setLoadingGames] = useState<boolean>(false);

  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const selectedGame = useMemo(() => games.find((g) => g.event_id === selectedEventId), [games, selectedEventId]);

  const teamOptions = useMemo(() => {
    const h = selectedGame?.home_team?.abbr;
    const a = selectedGame?.away_team?.abbr;
    const arr = [h, a].filter(Boolean) as string[];
    return Array.from(new Set(arr));
  }, [selectedGame]);

  const [teamAbbr, setTeamAbbr] = useState<string>("");
  const oppAbbr = useMemo(() => {
    if (!selectedGame) return "";
    const h = selectedGame.home_team?.abbr ?? "";
    const a = selectedGame.away_team?.abbr ?? "";
    if (!teamAbbr) return "";
    return teamAbbr === h ? a : h;
  }, [selectedGame, teamAbbr]);

  const [roster, setRoster] = useState<Roster | null>(null);
  const [rosterErr, setRosterErr] = useState<string>("");
  const [loadingRoster, setLoadingRoster] = useState<boolean>(false);

  const playerOptions = useMemo(() => {
    const players = roster?.players ?? [];
    return players
      .map((p) => {
        const mkt = findPlayerMarketType(sport, p.position);
        return {
          athlete_id: String(p.athlete_id),
          name: p.name,
          position: p.position ?? "",
          market_type: mkt,
        };
      })
      .filter((p) => p.market_type !== "unknown")
      .slice(0, 200);
  }, [roster, sport]);

  const [athleteId, setAthleteId] = useState<string>("");
  const selectedPlayer = useMemo(() => playerOptions.find((p) => p.athlete_id === athleteId), [playerOptions, athleteId]);

  const defaultLine = useMemo(() => {
    const mkt = selectedPlayer?.market_type ?? "points";
    return SPORT_CONFIG[sport].default_lines[mkt] ?? 20.5;
  }, [sport, selectedPlayer]);

  const [bookLine, setBookLine] = useState<number>(defaultLine);

  useEffect(() => {
    setSeason(SPORT_CONFIG[sport].default_season);
    setWeek(SPORT_CONFIG[sport].default_week);
    setSeasonType(SPORT_CONFIG[sport].default_season_type);
    setGames([]);
    setSelectedEventId("");
    setRoster(null);
    setAthleteId("");
  }, [sport]);

  useEffect(() => {
    setBookLine(defaultLine);
  }, [defaultLine]);

  async function loadGames() {
    setLoadingGames(true);
    setGamesErr("");
    try {
      const prefix = SPORT_CONFIG[sport].api_prefix;
      const qs =
        sport === "NFL"
          ? `season=${encodeURIComponent(String(season))}&season_type=${encodeURIComponent(String(seasonType))}&week=${encodeURIComponent(String(week))}`
          : `date=${encodeURIComponent(yyyymmdd(dateIso))}`;

      const res = await fetch(`/api/wspm/${prefix}/games-with-odds?${qs}`, { cache: "no-store" });
      const text = await res.text();
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);
      const data = JSON.parse(text);
      const g = (data?.games ?? []) as GameRow[];
      setGames(g);
      setSelectedEventId(g?.[0]?.event_id ?? "");
    } catch (e: any) {
      setGamesErr(String(e?.message ?? e));
      setGames([]);
    } finally {
      setLoadingGames(false);
    }
  }

  useEffect(() => {
    loadGames();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (teamOptions.length > 0) setTeamAbbr(teamOptions[0]);
    else setTeamAbbr("");
  }, [teamOptions]);

  async function loadRoster(abbr: string) {
    setLoadingRoster(true);
    setRosterErr("");
    setRoster(null);
    try {
      const prefix = SPORT_CONFIG[sport].api_prefix;
      const res = await fetch(`/api/wspm/${prefix}/team/${encodeURIComponent(abbr)}/roster`, { cache: "no-store" });
      const text = await res.text();
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);
      const data = JSON.parse(text);
      setRoster(data);

      const first = (data?.players ?? []).find((p: any) => findPlayerMarketType(sport, p?.position) !== "unknown");
      setAthleteId(first ? String(first.athlete_id) : "");
    } catch (e: any) {
      setRosterErr(String(e?.message ?? e));
      setRoster(null);
      setAthleteId("");
    } finally {
      setLoadingRoster(false);
    }
  }

  useEffect(() => {
    if (teamAbbr) loadRoster(teamAbbr);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamAbbr, sport]);

  const [projLoading, setProjLoading] = useState(false);
  const [projErr, setProjErr] = useState<string>("");
  const [projRaw, setProjRaw] = useState<any>(null);

  async function runProjection() {
    if (!selectedGame || !teamAbbr || !oppAbbr || !selectedPlayer) return;

    setProjLoading(true);
    setProjErr("");
    setProjRaw(null);

    let wk = week;
    let st = seasonType;
    if (sport === "NBA") {
      if (wk < 1) wk = 1;
      if (st < 1) st = 1;
    }

    const payload = {
      sport: sport.toLowerCase(),
      athlete_id: String(selectedPlayer.athlete_id),
      event_id: String(selectedGame.event_id),
      season: Number(season),
      season_type: Number(st),
      week: Number(wk),
      player_name: selectedPlayer.name,
      player_team: teamAbbr,
      opponent_team: oppAbbr,
      position: selectedPlayer.position,
      market_type: selectedPlayer.market_type,
      book_line: Number(bookLine),
    };

    try {
      const prefix = SPORT_CONFIG[sport].api_prefix;
      const res = await fetch(`/api/wspm/${prefix}/projection`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const text = await res.text();
      if (!res.ok) throw new Error(text);
      setProjRaw(JSON.parse(text));
    } catch (e: any) {
      setProjErr(String(e?.message ?? e));
    } finally {
      setProjLoading(false);
    }
  }

  const computed = useMemo(() => {
    if (!projRaw) return null;

    const { wspmProj, bookLine: usedLine, edge, safetyMarginPct, tier } = summarizeProjection(projRaw);
    const { direction, marginAbs, marginPct } = computeDirectionAndMargin(wspmProj, usedLine);
    const effectivePct = safetyMarginPct && safetyMarginPct > 0 ? safetyMarginPct : marginPct;
    const conf = classifyConfidenceFromMargin(effectivePct);
    const prob = estimateProbCover(effectivePct) * 100;

    return { wspmProj, usedLine, edge, safetyMarginPct, tier, direction, marginAbs, marginPct: effectivePct, conf, prob };
  }, [projRaw]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Player Props</h1>
        <p className="text-sm text-slate-600 mt-1">
          Reutiliza el mismo contrato del Streamlit: games-with-odds → roster → auto-projection-report.
        </p>
      </div>

      <div className="rounded-2xl bg-white shadow-soft border border-slate-100 p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-end gap-4">
          <div className="flex-1">
            <div className="text-xs uppercase tracking-wide text-slate-500">Deporte</div>
            <div className="mt-2 flex gap-2">
              {(["NBA", "NFL"] as SportKey[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setSport(s)}
                  className={`h-10 px-4 rounded-xl border text-sm font-medium transition-colors ${
                    sport === s
                      ? "bg-teal-50 border-teal-200 text-teal-900"
                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {SPORT_CONFIG[s].emoji} {s}
                </button>
              ))}
            </div>
          </div>

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
            <div className="w-full sm:w-72">
              <div className="text-xs uppercase tracking-wide text-slate-500">Date (NBA)</div>
              <input
                type="date"
                value={dateIso}
                onChange={(e) => setDateIso(e.target.value)}
                className="mt-2 w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-sm"
              />
            </div>
          )}

          <button
            onClick={loadGames}
            disabled={loadingGames}
            className="h-10 px-4 rounded-xl bg-slate-900 text-white text-sm font-medium disabled:opacity-60"
          >
            {loadingGames ? "Cargando..." : "Cargar juegos"}
          </button>
        </div>

        {gamesErr ? (
          <div className="rounded-xl border border-rose-100 bg-rose-50 p-3 text-sm text-rose-800">
            Error juegos: {gamesErr}
          </div>
        ) : null}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <div className="text-xs uppercase tracking-wide text-slate-500">Partido</div>
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="mt-2 w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-sm"
            >
              {games.map((g) => (
                <option key={g.event_id} value={g.event_id}>
                  {g.matchup} • {g.odds?.details ?? "—"} • O/U {g.odds?.over_under ?? "—"}
                </option>
              ))}
            </select>

            <div className="mt-3 text-sm text-slate-600">
              Event ID: <span className="font-mono">{selectedGame?.event_id ?? "—"}</span>
            </div>
          </div>

          <div>
            <div className="text-xs uppercase tracking-wide text-slate-500">Equipo</div>
            <select
              value={teamAbbr}
              onChange={(e) => setTeamAbbr(e.target.value)}
              className="mt-2 w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-sm"
            >
              {teamOptions.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <div className="mt-3 text-sm text-slate-600">
              Oponente: <span className="font-semibold">{oppAbbr || "—"}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <div className="text-xs uppercase tracking-wide text-slate-500">Jugador</div>
            <select
              value={athleteId}
              onChange={(e) => setAthleteId(e.target.value)}
              className="mt-2 w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-sm"
              disabled={loadingRoster}
            >
              {playerOptions.map((p) => (
                <option key={p.athlete_id} value={p.athlete_id}>
                  {p.name} ({p.position}) • {p.market_type.replaceAll("_", " ")}
                </option>
              ))}
            </select>
            {rosterErr ? (
              <div className="mt-3 rounded-xl border border-rose-100 bg-rose-50 p-3 text-sm text-rose-800">
                Error roster: {rosterErr}
              </div>
            ) : null}
          </div>

          <div>
            <div className="text-xs uppercase tracking-wide text-slate-500">Línea (Book)</div>
            <input
              type="number"
              step="0.5"
              value={bookLine}
              onChange={(e) => setBookLine(Number(e.target.value))}
              className="mt-2 w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-sm"
            />
            <div className="mt-2 text-xs text-slate-500">
              Mercado: <span className="font-medium">{selectedPlayer?.market_type ?? "—"}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <button
            onClick={runProjection}
            disabled={!selectedGame || !teamAbbr || !oppAbbr || !selectedPlayer || projLoading}
            className="h-10 px-4 rounded-xl bg-teal-600 text-white text-sm font-medium disabled:opacity-60"
          >
            {projLoading ? "Calculando..." : "Ejecutar Proyección WSPM"}
          </button>

          {projErr ? (
            <div className="rounded-xl border border-rose-100 bg-rose-50 p-3 text-sm text-rose-800 flex-1">
              Error proyección: {projErr}
            </div>
          ) : null}
        </div>
      </div>

      {computed ? (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="xl:col-span-2 rounded-2xl bg-white shadow-soft border border-slate-100 p-5 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs text-slate-500">Resultado</div>
                <div className="mt-1 text-lg font-semibold">
                  {tierEmoji(computed.tier)} {computed.tier} • {computed.direction} {computed.usedLine.toFixed(1)}
                </div>
                <div className="mt-1 text-sm text-slate-600">
                  Proy WSPM: <span className="font-semibold">{computed.wspmProj.toFixed(1)}</span> • Edge:{" "}
                  <span className="font-semibold">
                    {computed.edge >= 0 ? "+" : ""}
                    {computed.edge.toFixed(1)}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-500">Confianza</div>
                <div className="mt-1 text-lg font-semibold">{computed.conf}</div>
                <div className="mt-1 text-sm text-slate-600">P(cubrir) ~ {computed.prob.toFixed(1)}%</div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                <div className="text-xs text-slate-500">Margen Abs</div>
                <div className="mt-1 font-semibold">{computed.marginAbs.toFixed(1)}</div>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                <div className="text-xs text-slate-500">Margen %</div>
                <div className="mt-1 font-semibold">{computed.marginPct.toFixed(1)}%</div>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                <div className="text-xs text-slate-500">Safety % (backend)</div>
                <div className="mt-1 font-semibold">{computed.safetyMarginPct ? `${computed.safetyMarginPct.toFixed(1)}%` : "—"}</div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-100 bg-white p-4">
              <div className="text-xs text-slate-500">Texto para redes (demo)</div>
              <pre className="mt-2 whitespace-pre-wrap text-sm text-slate-800">{`${tierEmoji(computed.tier)} WSPM • ${
                selectedGame?.matchup ?? ""
              }
${selectedPlayer?.name ?? ""} (${teamAbbr} • ${selectedPlayer?.market_type ?? ""}) ${computed.direction} ${computed.usedLine.toFixed(1)}
Proy: ${computed.wspmProj.toFixed(1)} | Edge ${computed.edge >= 0 ? "+" : ""}${computed.edge.toFixed(1)} | Margen ${computed.marginPct.toFixed(1)}% | P(cubrir)~${computed.prob.toFixed(1)}% | Conf ${computed.conf}`}</pre>
            </div>
          </div>

          <div className="rounded-2xl bg-white shadow-soft border border-slate-100 p-5">
            <div className="text-sm font-semibold">Raw JSON</div>
            <pre className="mt-3 text-xs overflow-auto max-h-[520px] bg-slate-50 border border-slate-100 rounded-xl p-3">
              {JSON.stringify(projRaw, null, 2)}
            </pre>
          </div>
        </div>
      ) : null}
    </div>
  );
}
