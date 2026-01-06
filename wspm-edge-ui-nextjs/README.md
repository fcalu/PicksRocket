# WSPM Edge UI (Next.js)

Frontend profesional (Next.js + Tailwind) listo para conectarse a tu backend FastAPI en Render.

## Requisitos
- Node.js 18+ (recomendado 20+)
- npm

## Ejecutar local
1. Descomprime el zip.
2. Instala dependencias:
   ```bash
   npm install
   ```
3. (Opcional) Crea `.env.local` a partir de `.env.example` y define `NEXT_PUBLIC_API_BASE`.
   - Si lo dejas vacío, usa: `https://edgewspmfantasy.onrender.com`
4. Inicia en modo dev:
   ```bash
   npm run dev
   ```
5. Abre: http://localhost:3000

## Qué incluye
- Dashboard con KPIs (API status, latencia, conteo de juegos)
- Juegos (NBA/NFL/Soccer) consumiendo tus endpoints GET
- Picks (demo) derivados de odds, con UI tipo “fintech”
- Reportes (viewer) del `/openapi.json` para validar contrato/paths

## Nota
Los picks son **demo** (placeholder) mientras integras tus endpoints POST de proyección/reporte.
La UI está lista para integrar proyecciones reales cuando confirmes payloads.


## Screens
- `/props`: Player Props (manual) conectado al backend vía proxy Next.js.
