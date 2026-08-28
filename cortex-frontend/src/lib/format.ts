export function formatCurrency(value: number | null | undefined): string {
  const n = Number(value ?? 0);
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
  if (n >= 10_000) return `$${Math.round(n / 1000)}k`;
  return `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

export function formatCurrencyFull(value: number | null | undefined): string {
  const n = Number(value ?? 0);
  return `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

export function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
}

const RTF = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

export function formatRelativeTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diffSec = Math.round((then - now) / 1000);
  const abs = Math.abs(diffSec);

  if (abs < 60) return "just now";
  if (abs < 3600) return RTF.format(Math.round(diffSec / 60), "minute");
  if (abs < 86_400) return RTF.format(Math.round(diffSec / 3600), "hour");
  if (abs < 86_400 * 7) return RTF.format(Math.round(diffSec / 86_400), "day");
  if (abs < 86_400 * 30) return RTF.format(Math.round(diffSec / (86_400 * 7)), "week");
  if (abs < 86_400 * 365) return RTF.format(Math.round(diffSec / (86_400 * 30)), "month");
  return RTF.format(Math.round(diffSec / (86_400 * 365)), "year");
}
