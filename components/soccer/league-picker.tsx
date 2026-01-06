"use client";

import { useRouter } from "next/navigation";

type Tournament = { id: string; league_code: string; label: string; is_default?: boolean };

export function LeaguePicker({
  basePath,
  tournaments,
  league,
}: {
  basePath: string;
  tournaments: Tournament[];
  league: string;
}) {
  const router = useRouter();

  return (
    <div className="flex items-center gap-2">
      <label className="text-sm font-medium text-slate-700">Liga</label>
      <select
        className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm"
        value={league}
        onChange={(e) => {
          const next = e.target.value;
          router.push(`${basePath}?league=${encodeURIComponent(next)}`);
        }}
      >
        {tournaments.map((t) => (
          <option key={t.league_code || t.id} value={t.league_code}>
            {t.label}
          </option>
        ))}
      </select>
    </div>
  );
}
