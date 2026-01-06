import { NextResponse } from "next/server";

type TeamEntry = { id: string; abbr: string; name: string };

type LeagueCache = {
  ts: number;
  byAbbr: Map<string, string>;
  byName: Map<string, string>;
};

const CACHE_TTL_MS = 1000 * 60 * 60 * 12; // 12h
const leagueCache = new Map<string, LeagueCache>();

function normalizeName(s: string) {
  return (s || "")
    .toLowerCase()
    .replace(/\b(fc|cf|sc|ac|club)\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

async function fetchLeagueTeams(leagueCode: string): Promise<TeamEntry[]> {
  const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/${encodeURIComponent(
    leagueCode
  )}/teams`;

  const res = await fetch(url, {
    headers: { accept: "application/json" },
    // Teams list is stable; cache it on the server.
    next: { revalidate: 60 * 60 * 12 },
  });

  if (!res.ok) {
    throw new Error(`ESPN teams fetch failed (${res.status})`);
  }

  const data: any = await res.json();

  // Typical shape: sports[0].leagues[0].teams[]
  const teams =
    data?.sports?.[0]?.leagues?.[0]?.teams ??
    data?.leagues?.[0]?.teams ??
    data?.teams ??
    [];

  const out: TeamEntry[] = [];
  for (const t of teams) {
    const team = t?.team ?? t;
    const id = String(team?.id ?? "").trim();
    const abbr = String(team?.abbreviation ?? team?.abbr ?? "").trim();
    const name = String(team?.displayName ?? team?.name ?? "").trim();
    if (!id || (!abbr && !name)) continue;
    out.push({ id, abbr, name });
  }
  return out;
}

async function getLeagueIndex(leagueCode: string) {
  const now = Date.now();
  const cached = leagueCache.get(leagueCode);
  if (cached && now - cached.ts < CACHE_TTL_MS) return cached;

  const teams = await fetchLeagueTeams(leagueCode);

  const byAbbr = new Map<string, string>();
  const byName = new Map<string, string>();

  for (const t of teams) {
    if (t.abbr) byAbbr.set(t.abbr.toUpperCase(), t.id);
    if (t.name) byName.set(normalizeName(t.name), t.id);
  }

  const nextCache: LeagueCache = { ts: now, byAbbr, byName };
  leagueCache.set(leagueCode, nextCache);
  return nextCache;
}

function logoUrlFromId(id: string) {
  // Use combiner so we can control size without depending on exact file sizes.
  return `https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/${encodeURIComponent(
    id
  )}.png&w=80&h=80&scale=crop`;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const league = (searchParams.get("league") || "").trim();
  const abbr = (searchParams.get("abbr") || "").trim();
  const name = (searchParams.get("name") || "").trim();

  if (!league) {
    return NextResponse.json({ url: "" }, { status: 200 });
  }

  try {
    const idx = await getLeagueIndex(league);

    const idByAbbr = abbr ? idx.byAbbr.get(abbr.toUpperCase()) : undefined;
    const idByName = name ? idx.byName.get(normalizeName(name)) : undefined;

    const id = idByAbbr || idByName;

    return NextResponse.json({ url: id ? logoUrlFromId(id) : "" }, { status: 200 });
  } catch {
    // Fail soft: render initials on client
    return NextResponse.json({ url: "" }, { status: 200 });
  }
}
