import { Badge } from "@/components/ui/badge";

function shortJson(obj: unknown, limit = 2500) {
  try {
    const s = JSON.stringify(obj, null, 2);
    return s.length > limit ? s.slice(0, limit) + "\n... (truncado)" : s;
  } catch {
    return "No se pudo serializar JSON";
  }
}

export function OpenApiViewer({ openapi }: { openapi: any }) {
  if (!openapi || openapi.error) {
    return (
      <div className="rounded-2xl border border-rose-100 bg-rose-50 p-5 text-rose-800">
        No pude cargar <span className="font-mono">/openapi.json</span>. {openapi?.error ?? ""}
      </div>
    );
  }

  const title = openapi?.info?.title ?? "OpenAPI";
  const version = openapi?.info?.version ?? "—";
  const paths = openapi?.paths ? Object.keys(openapi.paths) : [];
  const methodsCount = paths.reduce((acc: number, p: string) => acc + Object.keys(openapi.paths[p] ?? {}).length, 0);

  return (
    <div className="rounded-2xl bg-white shadow-soft border border-slate-100 p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="text-sm text-slate-600 mt-1">
            Versión {version} • {paths.length} paths • {methodsCount} operaciones
          </p>
        </div>
        <Badge variant="info">GET</Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
          <div className="text-sm font-semibold">Paths</div>
          <div className="mt-2 max-h-[360px] overflow-auto space-y-1 text-sm">
            {paths.slice(0, 200).map((p) => (
              <div key={p} className="flex items-center justify-between gap-2 border-b border-slate-100 py-1">
                <span className="font-mono text-xs text-slate-700">{p}</span>
                <span className="text-xs text-slate-500">{Object.keys(openapi.paths[p] ?? {}).join(", ").toUpperCase()}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
          <div className="text-sm font-semibold">Raw JSON (truncado)</div>
          <pre className="mt-2 text-xs overflow-auto max-h-[360px] bg-white border border-slate-100 rounded-lg p-3">
{shortJson(openapi)}
          </pre>
        </div>
      </div>
    </div>
  );
}
