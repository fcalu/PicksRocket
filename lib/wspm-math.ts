export function computeDirectionAndMargin(wspmProjection: number, bookLine: number) {
  if (!bookLine || bookLine <= 0) {
    return { direction: "OVER" as const, marginAbs: 0, marginPct: 0 };
  }

  const direction = wspmProjection >= bookLine ? ("OVER" as const) : ("UNDER" as const);
  const marginAbs = Math.abs(wspmProjection - bookLine);
  const marginPct = (marginAbs / bookLine) * 100;

  return { direction, marginAbs, marginPct };
}

export function classifyConfidenceFromMargin(marginPct: number) {
  if (marginPct > 15) return "Alta";
  if (marginPct > 10) return "Media-Alta";
  if (marginPct > 5) return "Media";
  return "Baja";
}

export function estimateProbCover(marginPct: number) {
  let p = 0.5 + (marginPct / 100) * 0.75;
  if (p < 0.5) p = 0.5;
  if (p > 0.8) p = 0.8;
  return p;
}

export const TIER_PLATINUM_EDGE = 25.0;
export const TIER_PREMIUM_EDGE = 15.0;
export const TIER_VALUE_EDGE = 8.0;

export function tierFromEdge(edge: number) {
  if (edge >= TIER_PLATINUM_EDGE) return "Platinum";
  if (edge >= TIER_PREMIUM_EDGE) return "Premium";
  if (edge >= TIER_VALUE_EDGE) return "Value";
  return "Leans";
}

export function tierEmoji(tier: string) {
  const t = (tier ?? "").toLowerCase();
  if (t === "platinum") return "💎";
  if (t === "premium") return "🎯";
  if (t === "value") return "📈";
  return "➖";
}
