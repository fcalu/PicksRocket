"use client";

import { UserCircle2, LogOut } from "lucide-react";
import { MobileNav } from "@/components/ui/mobile-nav";
import { signIn, signOut, useSession } from "next-auth/react";
import Image from "next/image";

export function Topbar() {
  const { data, status } = useSession();
  const user = data?.user;

  return (
    <header className="sticky top-0 z-20 bg-white/80 backdrop-blur border-b border-slate-200">
      <div className="px-4 md:px-8 h-14 flex items-center gap-3">
        <MobileNav />

        <div className="flex-1" />

        {status === "authenticated" ? (
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 px-3 h-10 rounded-xl border border-slate-200 bg-white">
              {user?.image ? (
                <Image src={user.image} alt="avatar" width={24} height={24} className="rounded-full" />
              ) : (
                <UserCircle2 className="h-5 w-5 text-slate-600" />
              )}
              <div className="text-sm">
                <div className="font-medium leading-tight text-slate-800">
                  {user?.name ?? user?.email ?? "Cuenta"}
                </div>
                <div className="text-xs text-slate-500 -mt-0.5">Sesión activa</div>
              </div>
            </div>

            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="h-10 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 flex items-center gap-2"
            >
              <LogOut className="h-4 w-4 text-slate-600" />
              <span className="text-sm">Salir</span>
            </button>
          </div>
        ) : (
          <button
            onClick={() => signIn(undefined, { callbackUrl: "/" })}
            className="h-10 px-4 rounded-xl bg-slate-900 text-white hover:bg-slate-800 text-sm"
          >
            Iniciar sesión
          </button>
        )}
      </div>
    </header>
  );
}
