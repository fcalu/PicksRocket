import { NextResponse } from "next/server";

const DEFAULT_BASE = "https://edgewspmfantasy.onrender.com";

function baseUrl() {
  const env = process.env.NEXT_PUBLIC_API_BASE;
  return (env && env.trim().length > 0 ? env : DEFAULT_BASE).replace(/\/$/, "");
}

export async function GET(req: Request, ctx: { params: { sport: string } }) {
  const sport = (ctx.params.sport || "").toLowerCase();
  if (!["nfl", "nba", "soccer"].includes(sport)) {
    return NextResponse.json({ error: "Invalid sport" }, { status: 400 });
  }

  const url = new URL(req.url);
  const backend = new URL(`${baseUrl()}/api/v1/${sport}/games-with-odds`);

  url.searchParams.forEach((v, k) => backend.searchParams.set(k, v));

  const res = await fetch(backend.toString(), {
    headers: { accept: "application/json" },
    cache: "no-store",
  });

  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: { "content-type": res.headers.get("content-type") ?? "application/json" },
  });
}
