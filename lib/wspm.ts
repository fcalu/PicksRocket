import { GameRow } from "@/lib/wspm-types";
import { SoccerGameRow, SoccerTournament, SoccerGameProjection } from "@/lib/soccer-types";

const DEFAULT_BASE = "https://edgewspmfantasy.onrender.com";

export function apiBase(): string {
  const env = process.env.NEXT_PUBLIC_API_BASE;
  if (env && env.trim().length > 0) return env.replace(/\/$/, "");
  return DEFAULT_BASE;
}

async function fetchJson<T>(
  path: string,
  init?: (RequestInit & { timeoutMs?: number; next?: any })
): Promise<{ data: T; ms: number }> {
  const base = apiBase();
  const url = `${base}${path}`;

  const timeoutMs = init?.timeoutMs ?? 25000;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  const t0 = Date.now();

  try {
    const res = await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: {
        accept: "application/json",
        ...(init?.headers ?? {}),
      },
    });

    const ms = Date.now() - t0;

    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      throw new Error(`HTTP ${res.status} ${res.statusText} :: ${txt.slice(0, 250)}`);
    }

    const data = (await res.json()) as T;
    return { data, ms };
  } finally {
    clearTimeout(id);
  }
}

export function yyyymmddToday(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}${mm}${dd}`;
}

export function yyyymmddOffset(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}${mm}${dd}`;
}

export async function getHealth(): Promise<{ ok: boolean; ms: number }> {
  const { ms } = await fetchJson<any>("/api/v1/health", { next: { revalidate: 60 } as any });
  return { ok: true, ms };
}

export async function getOpenApi(): Promise<any> {
  const { data } = await fetchJson<any>("/openapi.json", {
    next: { revalidate: 3600 } as any,
    timeoutMs: 30000,
  });
  return data;
}

/**
 * NBA games-with-odds expects: ?date=YYYYMMDD
 */
export async function getNbaGamesWithOdds(date: string): Promise<{ games: GameRow[] }> {
  const { data } = await fetchJson<any>(`/api/v1/nba/games-with-odds?date=${encodeURIComponent(date)}`, {
    next: { revalidate: 120 } as any,
  });
  return { games: (data?.games ?? []) as GameRow[] };
}

/**
 * NFL games-with-odds:
 * - Some deployments accept ?date=YYYYMMDD
 * - Others accept season/week params.
 * We try date first; if it fails, caller should use fallback.
 */
export async function getNflGamesWithOddsByDate(date: string): Promise<{ games: GameRow[] }> {
  const { data } = await fetchJson<any>(`/api/v1/nfl/games-with-odds?date=${encodeURIComponent(date)}`, {
    next: { revalidate: 120 } as any,
  });
  return { games: (data?.games ?? []) as GameRow[] };
}

export async function getNflGamesWithOddsByWeek(params: {
  season: number;
  season_type: number;
  week: number;
}): Promise<{ games: GameRow[] }> {
  const { season, season_type, week } = params;
  const { data } = await fetchJson<any>(
    `/api/v1/nfl/games-with-odds?season=${season}&season_type=${season_type}&week=${week}`,
    { next: { revalidate: 120 } as any }
  );
  return { games: (data?.games ?? []) as GameRow[] };
}

export async function getSoccerTournaments(): Promise<{ tournaments: SoccerTournament[] }> {
  const { data } = await fetchJson<any>(`/api/v1/soccer/tournaments`, { next: { revalidate: 3600 } as any });
  return { tournaments: (data?.tournaments ?? []) as SoccerTournament[] };
}

export async function getSoccerGamesWithOdds(league: string): Promise<{ games: SoccerGameRow[] }> {
  const { data } = await fetchJson<any>(`/api/v1/soccer/games-with-odds?league=${encodeURIComponent(league)}`, {
    next: { revalidate: 120 } as any,
  });
  return { games: (data?.games ?? data ?? []) as SoccerGameRow[] };
}

export async function getSoccerGameProjection(event_id: string, league: string): Promise<SoccerGameProjection> {
  const { data } = await fetchJson<SoccerGameProjection>(`/api/v1/soccer/game-projection`, {
    method: "POST",
    body: JSON.stringify({ event_id, league_code: league, league }),
    headers: { "content-type": "application/json" },
    cache: "no-store",
    timeoutMs: 30000,
  });
  return data;
}
