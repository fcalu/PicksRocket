import { NextResponse } from "next/server";

const DEFAULT_BASE = "https://edgewspmfantasy.onrender.com";

function baseUrl() {
  const env = process.env.NEXT_PUBLIC_API_BASE;
  return (env && env.trim().length > 0 ? env : DEFAULT_BASE).replace(/\/$/, "");
}

async function fetchJson(url: string, init?: RequestInit) {
  const res = await fetch(url, {
    headers: { "content-type": "application/json", accept: "application/json" },
    ...init,
    // Projection is dynamic but can be cached very briefly.
    next: { revalidate: 30 },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} from soccer game-projection: ${text.slice(0, 200)}`);
  }
  return res.json();
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const event_id = String(body?.event_id ?? "").trim();
  const league = body?.league ? String(body.league).trim() : undefined;

  if (!event_id) {
    return NextResponse.json({ error: "event_id is required" }, { status: 400 });
  }

  const payload = league ? { event_id, league } : { event_id };
  const data = await fetchJson(`${baseUrl()}/api/v1/soccer/game-projection`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return NextResponse.json(data);
}
