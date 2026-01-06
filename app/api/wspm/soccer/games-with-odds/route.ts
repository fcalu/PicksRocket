import { NextResponse } from "next/server";

const DEFAULT_BASE = "https://edgewspmfantasy.onrender.com";

function baseUrl() {
  const env = process.env.NEXT_PUBLIC_API_BASE;
  return (env && env.trim().length > 0 ? env : DEFAULT_BASE).replace(/\/$/, "");
}

async function fetchJson(url: string) {
  const res = await fetch(url, {
    headers: { accept: "application/json" },
    // Cache short to avoid hammering backend
    next: { revalidate: 60 },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} from soccer games-with-odds: ${text.slice(0, 200)}`);
  }
  return res.json();
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const league = searchParams.get("league")?.trim();

  // The backend accepts either an alias (e.g., premier_league, liga_mx) or ESPN code (e.g., eng.1).
  // If omitted, the backend will choose its default.
  const qs = league ? `?league=${encodeURIComponent(league)}` : "";

  const data = await fetchJson(`${baseUrl()}/api/v1/soccer/games-with-odds${qs}`);
  return NextResponse.json(data);
}
