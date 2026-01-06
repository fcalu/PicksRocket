"use client";

import { Rocket, LayoutDashboard, CalendarDays, Target, FileText, LineChart } from "lucide-react";
import { NavItem } from "@/components/ui/nav-item";

export function Sidebar() {
  return (
    <aside className="hidden md:flex md:w-64 md:flex-col border-r border-slate-200 bg-white">
      <div className="px-5 py-5 flex items-center gap-2">
        <div className="h-9 w-9 rounded-xl bg-teal-600 flex items-center justify-center shadow-sm">
          <Rocket className="h-5 w-5 text-white" />
        </div>
        <div>
          <div className="font-semibold leading-tight">WSPM Edge</div>
          <div className="text-xs text-slate-500 -mt-0.5">picksrocketmx • UI demo</div>
        </div>
      </div>

      <nav className="px-3 py-2 space-y-1">
        <NavItem href="/" icon={LayoutDashboard} label="Dashboard" />
        <NavItem href="/games" icon={CalendarDays} label="Juegos" />
        <NavItem href="/picks" icon={Target} label="Picks" />
        <NavItem href="/props" icon={Target} label="Player Props" />
        <NavItem href="/reports" icon={FileText} label="Reportes" />
        <NavItem href="/history" icon={LineChart} label="Historial" />
      </nav>

      <div className="mt-auto p-4">
        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-700">
          <div className="font-semibold">Siguiente paso</div>
          <div className="text-slate-600 mt-1">
            Integrar endpoints POST de proyección y persistencia de picks.
          </div>
        </div>
      </div>
    </aside>
  );
}
