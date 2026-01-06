import { tierFromEdge } from "@/lib/wspm-math";

export type ProjectionAny = Record<string, any>;

export function summarizeProjection(prediction: ProjectionAny) {
  let wspmProj = prediction?.wspm_projection;
  if (wspmProj == null) wspmProj = prediction?.model_projection ?? prediction?.projection ?? 0;
  wspmProj = Number(wspmProj) || 0;

  let bookLine = prediction?.book_line;
  if (bookLine == null) bookLine = prediction?.input_book_line ?? 0;
  bookLine = Number(bookLine) || 0;

  let edge = prediction?.edge;
  if (edge == null && bookLine) edge = wspmProj - bookLine;
  edge = Number(edge) || 0;

  const safetyMarginPct = Number(prediction?.safety_margin_pct ?? 0) || 0;
  const tier = tierFromEdge(edge);

  return { wspmProj, bookLine, edge, safetyMarginPct, tier };
}
