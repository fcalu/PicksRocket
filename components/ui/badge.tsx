import { clsx } from "clsx";

export function Badge({
  children,
  variant = "info",
}: {
  children: React.ReactNode;
  variant?: "info" | "good" | "warn";
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium border",
        {
          "bg-slate-50 text-slate-700 border-slate-200": variant === "info",
          "bg-teal-50 text-teal-800 border-teal-200": variant === "good",
          "bg-amber-50 text-amber-800 border-amber-200": variant === "warn",
        }
      )}
    >
      {children}
    </span>
  );
}
