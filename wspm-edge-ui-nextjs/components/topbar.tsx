import { Search, Bell, UserCircle2 } from "lucide-react";
import { MobileNav } from "@/components/ui/mobile-nav";

export function Topbar() {
  return (
    <header className="sticky top-0 z-20 bg-white/80 backdrop-blur border-b border-slate-200">
      <div className="px-4 md:px-8 h-14 flex items-center gap-3">
        <MobileNav />
        <div className="flex-1 flex items-center gap-2 max-w-xl">
          <div className="relative w-full">
            <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              placeholder="Buscar juego, equipo, mercado… (demo)"
              className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-300 text-sm"
            />
          </div>
        </div>

        <button className="h-10 w-10 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center">
          <Bell className="h-4 w-4 text-slate-600" />
        </button>
        <button className="h-10 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-3 flex items-center gap-2">
          <UserCircle2 className="h-5 w-5 text-slate-600" />
          <span className="text-sm text-slate-700 hidden sm:inline">Invitado</span>
        </button>
      </div>
    </header>
  );
}
