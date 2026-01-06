import { OpenApiViewer } from "@/components/openapi-viewer";
import { getOpenApi } from "@/lib/wspm";

export default async function ReportsPage() {
  const openapi = await getOpenApi().catch((e) => ({ error: String(e) }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Reportes / API Contract</h1>
        <p className="text-sm text-slate-600 mt-1">
          Viewer del OpenAPI para validar endpoints y esquemas. Útil para integrar los POST de proyección.
        </p>
      </div>

      <OpenApiViewer openapi={openapi} />
    </div>
  );
}
