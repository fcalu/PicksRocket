import { NextResponse } from "next/server";

const DEFAULT_BASE = "https://edgewspmfantasy.onrender.com";

function baseUrl() {
  const env = process.env.NEXT_PUBLIC_API_BASE;
  return (env && env.trim().length > 0 ? env : DEFAULT_BASE).replace(/\/$/, "");
}

async function fetchJson(url: string) {
  const res = await fetch(url, { headers: { accept: "application/json" }, cache: "no-store" });
  const text = await res.text();
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${text.slice(0, 300)}`);
  return JSON.parse(text);
}

export async function GET() {
  try {
    const data = await fetchJson(`${baseUrl()}/api/v1/soccer/tournaments`);
    return NextResponse.json(data, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message ?? e) }, { status: 502 });
  }
}
