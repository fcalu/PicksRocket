import "./globals.css";
import type { Metadata } from "next";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";

export const metadata: Metadata = {
  title: "WSPM Edge",
  description: "WSPM Edge dashboard (UI demo)",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <div className="min-h-screen flex">
          <Sidebar />
          <div className="flex-1 flex flex-col">
            <Topbar />
            <main className="px-5 md:px-8 py-6">{children}</main>
            <footer className="px-5 md:px-8 pb-8 text-xs text-slate-500">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <span>WSPM Edge UI • Next.js + Tailwind</span>
                <span>Demo: UI profesional + consumo de endpoints GET</span>
              </div>
            </footer>
          </div>
        </div>
      </body>
    </html>
  );
}
