"use client";

import { LayoutDashboard, CalendarDays, Target, FileText, LineChart, Sparkles, Activity, Globe } from "lucide-react";
import { NavItem } from "@/components/ui/nav-item";

export function Sidebar() {
  return (
    <aside className="hidden md:flex md:w-64 md:flex-col border-r border-slate-200 bg-white">
      <div className="px-5 py-5 flex items-center gap-2">
        <div className="h-9 w-9 rounded-xl overflow-hidden shadow-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/logo-mark.svg" alt="PicksRocket" className="h-9 w-9" />
        </div>
        <div>
          <div className="font-semibold leading-tight">PicksRocket</div>
          <div className="text-xs text-slate-500 -mt-0.5">picksrocketmx</div>
        </div>
      </div>

      <nav className="px-3 py-2 space-y-1">
        <NavItem href="/" icon={LayoutDashboard} label="Dashboard" />
        <NavItem href="/games" icon={CalendarDays} label="Juegos" />
        <NavItem href="/game-picks" icon={Activity} label="Predicciones" />
        <NavItem href="/picks" icon={Target} label="Picks" />
        <NavItem href="/ai-picks" icon={Sparkles} label="AI Picks" />
        <NavItem href="/soccer" icon={Globe} label="Soccer" />
        <NavItem href="/soccer-picks" icon={Globe} label="Soccer Picks" />
        <NavItem href="/props" icon={Target} label="Player Props" />
        <NavItem href="/reports" icon={FileText} label="Reportes" />
        <NavItem href="/history" icon={LineChart} label="Historial" />
      </nav>

        <div className="mt-auto p-4">
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-700">
      <div className="font-semibold">PicksRocket</div>
      <div className="text-slate-600 mt-1">
        v1.3 • Picks y predicciones generadas por el motor de proyección. Apuesta con responsabilidad.
      </div>
    </div>
  </div>
</aside>
  );
}
