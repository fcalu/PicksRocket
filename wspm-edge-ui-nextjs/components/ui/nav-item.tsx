"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import type { LucideIcon } from "lucide-react";

export function NavItem({ href, icon: Icon, label }: { href: string; icon: LucideIcon; label: string }) {
  const pathname = usePathname();
  const active = pathname === href;

  return (
    <Link
      href={href}
      className={clsx(
        "flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-colors",
        active
          ? "bg-teal-50 text-teal-900 border border-teal-100"
          : "text-slate-700 hover:bg-slate-50"
      )}
    >
      <Icon className={clsx("h-4 w-4", active ? "text-teal-700" : "text-slate-500")} />
      <span className="font-medium">{label}</span>
    </Link>
  );
}
