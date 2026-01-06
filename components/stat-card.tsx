import { clsx } from "clsx";

export function StatCard({
  title,
  value,
  subtitle,
  tone = "neutral"
}: {
  title: string;
  value: string;
  subtitle?: string;
  tone?: "neutral" | "good" | "bad";
}) {
  return (
    <div className="rounded-2xl bg-white shadow-soft border border-slate-100 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-wide text-slate-500">{title}</div>
          <div className={clsx("mt-2 text-2xl font-semibold", {
            "text-slate-900": tone === "neutral",
            "text-teal-700": tone === "good",
            "text-rose-700": tone === "bad"
          })}>
            {value}
          </div>
          {subtitle ? <div className="mt-1 text-sm text-slate-600">{subtitle}</div> : null}
        </div>
        <div className={clsx("h-10 w-10 rounded-xl flex items-center justify-center", {
          "bg-slate-50": tone === "neutral",
          "bg-teal-50": tone === "good",
          "bg-rose-50": tone === "bad",
        })}>
          <div className={clsx("h-2.5 w-2.5 rounded-full", {
            "bg-slate-400": tone === "neutral",
            "bg-teal-500": tone === "good",
            "bg-rose-500": tone === "bad",
          })} />
        </div>
      </div>
    </div>
  );
}
