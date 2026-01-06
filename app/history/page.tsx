import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function confPill(conf: string) {
  const base = "px-2 py-0.5 rounded-full text-xs border whitespace-nowrap";
  if (conf === "Alta") return `${base} bg-emerald-50 text-emerald-800 border-emerald-200`;
  if (conf === "Media-Alta") return `${base} bg-teal-50 text-teal-800 border-teal-200`;
  if (conf === "Media") return `${base} bg-amber-50 text-amber-900 border-amber-200`;
  return `${base} bg-slate-50 text-slate-700 border-slate-200`;
}

export default async function HistoryPage() {
  const session = await getServerSession(authOptions);
  // @ts-expect-error
  const userId = session?.user?.id as string | undefined;

  if (!userId) {
    return (
      <div className="space-y-3">
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Historial</h1>
        <p className="text-sm text-slate-600">Inicia sesión para ver tu historial.</p>
      </div>
    );
  }

  const picks = await prisma.pick.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Historial</h1>
        <p className="text-sm text-slate-600 mt-1">
          Picks guardados (sin monetización todavía). Próximo paso: resultados, ROI y backtesting.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 text-sm font-semibold">
          Últimos {picks.length} picks
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="text-left px-4 py-2">Fecha</th>
                <th className="text-left px-4 py-2">Partido</th>
                <th className="text-left px-4 py-2">Tipo</th>
                <th className="text-left px-4 py-2">Pick</th>
                <th className="text-left px-4 py-2">Conf</th>
                <th className="text-left px-4 py-2">Diff</th>
              </tr>
            </thead>
            <tbody>
              {picks.map((p) => (
                <tr key={p.id} className="border-t border-slate-100">
                  <td className="px-4 py-2 text-slate-600 font-mono">{p.date}</td>
                  <td className="px-4 py-2">{p.matchup}</td>
                  <td className="px-4 py-2 text-slate-600">{p.type}</td>
                  <td className="px-4 py-2 font-semibold">{p.label}</td>
                  <td className="px-4 py-2">
                    <span className={confPill(p.confidence)}>{p.confidence}</span>
                  </td>
                  <td className="px-4 py-2 font-mono text-slate-700">{p.diff.toFixed(2)}</td>
                </tr>
              ))}
              {picks.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-slate-600" colSpan={6}>
                    Aún no tienes picks guardados. Ve a <span className="font-semibold">Predicciones</span> y guarda tu Top 6.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
