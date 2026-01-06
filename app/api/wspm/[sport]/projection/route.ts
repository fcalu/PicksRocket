import { NextResponse } from "next/server";

const DEFAULT_BASE = "https://edgewspmfantasy.onrender.com";

function baseUrl() {
  const env = process.env.NEXT_PUBLIC_API_BASE;
  return (env && env.trim().length > 0 ? env : DEFAULT_BASE).replace(/\/$/, "");
}

export async function POST(req: Request, ctx: { params: { sport: string } }) {
  const sport = (ctx.params.sport || "").toLowerCase();
  if (!["nfl", "nba"].includes(sport)) {
    return NextResponse.json({ error: "Invalid sport" }, { status: 400 });
  }

  const payload = await req.json().catch(() => null);
  if (!payload) return NextResponse.json({ error: "Missing JSON body" }, { status: 400 });

  const backend = `${baseUrl()}/api/v1/${sport}/wspm/auto-projection-report`;
  const res = await fetch(backend, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: { "content-type": res.headers.get("content-type") ?? "application/json" },
  });
}
