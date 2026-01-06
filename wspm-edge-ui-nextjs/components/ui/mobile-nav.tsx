"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, LayoutDashboard, CalendarDays, Target, FileText, LineChart, Rocket } from "lucide-react";
import { clsx } from "clsx";
import { usePathname } from "next/navigation";

const items = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/games", label: "Juegos", icon: CalendarDays },
  { href: "/picks", label: "Picks", icon: Target },
    { href: "/props", label: "Player Props", icon: Target },
  { href: "/reports", label: "Reportes", icon: FileText },
  { href: "/history", label: "Historial", icon: LineChart },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      <button
        className="md:hidden h-10 w-10 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5 text-slate-700" />
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-80 bg-white shadow-xl border-r border-slate-200 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-xl bg-teal-600 flex items-center justify-center">
                  <Rocket className="h-5 w-5 text-white" />
                </div>
                <div>
                  <div className="font-semibold leading-tight">WSPM Edge</div>
                  <div className="text-xs text-slate-500 -mt-0.5">picksrocketmx</div>
                </div>
              </div>
              <button
                className="h-10 w-10 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
              >
                <X className="h-5 w-5 text-slate-700" />
              </button>
            </div>

            <div className="mt-4 space-y-1">
              {items.map(({ href, label, icon: Icon }) => {
                const active = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setOpen(false)}
                    className={clsx(
                      "flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-colors",
                      active ? "bg-teal-50 text-teal-900 border border-teal-100" : "text-slate-700 hover:bg-slate-50"
                    )}
                  >
                    <Icon className={clsx("h-4 w-4", active ? "text-teal-700" : "text-slate-500")} />
                    <span className="font-medium">{label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
