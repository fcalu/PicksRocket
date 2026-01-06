import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  // @ts-expect-error
  const userId = session?.user?.id as string | undefined;

  if (!userId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const sport = String(body.sport || "nba");
  const date = String(body.date || "");
  const picks = Array.isArray(body.picks) ? body.picks : [];

  if (!date) {
    return NextResponse.json({ error: "date requerido" }, { status: 400 });
  }
  if (!picks.length) {
    return NextResponse.json({ error: "picks requerido" }, { status: 400 });
  }

  const data = picks.slice(0, 25).map((p: any) => ({
    userId,
    sport,
    date,
    eventId: String(p.event_id || p.eventId || ""),
    matchup: String(p.matchup || ""),
    type: String(p.type || p.market || ""),
    label: String(p.label || ""),
    confidence: String(p.confidence || ""),
    diff: Number(p.diff ?? 0),
    provider: p.provider ? String(p.provider) : null,
    oddsDetails: p.oddsDetails ? String(p.oddsDetails) : null,
    totalLine: p.totalLine != null ? Number(p.totalLine) : null,
    homeSpread: p.homeSpread != null ? Number(p.homeSpread) : null,
    projectedHome: p.projectedHome != null ? Number(p.projectedHome) : null,
    projectedAway: p.projectedAway != null ? Number(p.projectedAway) : null,
    projectedTotal: p.projectedTotal != null ? Number(p.projectedTotal) : null,
  }));

  const created = await prisma.pick.createMany({ data });

  return NextResponse.json({ ok: true, created: created.count });
}
