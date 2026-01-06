"use client";

import { useEffect, useMemo, useState } from "react";
import { teamLogoUrl, type LeagueKey } from "@/lib/team-logos";

export function TeamLogo({
  league,
  abbr,
  name,
  size = 28,
  className = "",
  soccerLeagueCode,
}: {
  league: LeagueKey;
  abbr: string;
  name?: string | null;
  size?: number;
  className?: string;
  /** Only for soccer: e.g. 'eng.1', 'esp.1' */
  soccerLeagueCode?: string;
}) {
  const [error, setError] = useState(false);
  const [soccerSrc, setSoccerSrc] = useState<string>("");

  const label = (abbr ?? "").toUpperCase();

  const staticSrc = useMemo(() => teamLogoUrl(league, abbr), [league, abbr]);

  useEffect(() => {
    let cancelled = false;

    async function loadSoccerLogo() {
      if (league !== "soccer") return;
      if (!soccerLeagueCode) return;

      try {
        const params = new URLSearchParams({
          league: soccerLeagueCode,
          abbr: abbr ?? "",
          name: name ?? "",
        });

        const res = await fetch(`/api/wspm/soccer/team-logo?${params.toString()}`);
        const data = (await res.json()) as { url?: string };

        if (!cancelled) {
          setSoccerSrc(data?.url || "");
        }
      } catch {
        if (!cancelled) setSoccerSrc("");
      }
    }

    loadSoccerLogo();

    return () => {
      cancelled = true;
    };
  }, [league, soccerLeagueCode, abbr, name]);

  const src = league === "soccer" ? soccerSrc : staticSrc;

  if (!src || error) {
    return (
      <div
        className={`inline-flex items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-semibold ${className}`}
        style={{
          width: size,
          height: size,
          fontSize: Math.max(10, Math.floor(size * 0.32)),
        }}
        title={name ?? label}
        aria-label={name ?? label}
      >
        {label.slice(0, 3)}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={name ?? label}
      width={size}
      height={size}
      loading="lazy"
      onError={() => setError(true)}
      className={`rounded-xl border border-slate-100 bg-white ${className}`}
      style={{ width: size, height: size, objectFit: "contain" }}
    />
  );
}
