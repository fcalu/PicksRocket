import { NextResponse } from "next/server";

const DEFAULT_BASE = "https://edgewspmfantasy.onrender.com";

function baseUrl() {
  const env = process.env.NEXT_PUBLIC_API_BASE;
  return (env && env.trim().length > 0 ? env : DEFAULT_BASE).replace(/\/$/, "");
}

export async function GET(_req: Request, ctx: { params: { sport: string; abbr: string } }) {
  const sport = (ctx.params.sport || "").toLowerCase();
  const abbr = ctx.params.abbr;

  if (!["nfl", "nba"].includes(sport)) {
    return NextResponse.json({ error: "Invalid sport" }, { status: 400 });
  }

  const backend = `${baseUrl()}/api/v1/${sport}/team/${encodeURIComponent(abbr)}/roster`;
  const res = await fetch(backend, { headers: { accept: "application/json" }, cache: "no-store" });
  const text = await res.text();

  return new NextResponse(text, {
    status: res.status,
    headers: { "content-type": res.headers.get("content-type") ?? "application/json" },
  });
}
