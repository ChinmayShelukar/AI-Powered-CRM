import type { Deal, DealStage } from "@/types/api";

const COMPANY_PALETTE = [
  "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300",
  "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",
  "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
  "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
  "bg-cyan-100 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-300",
  "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-500/15 dark:text-fuchsia-300",
];

export function companyChipClass(seed: string | null | undefined): string {
  if (!seed) return COMPANY_PALETTE[0];
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return COMPANY_PALETTE[Math.abs(h) % COMPANY_PALETTE.length];
}

export function companyInitial(name: string | null | undefined): string {
  if (!name) return "·";
  const trimmed = name.trim();
  if (!trimmed) return "·";
  return trimmed[0]!.toUpperCase();
}

export type Priority = "high" | "soon" | "overdue" | null;

export function dealPriority(deal: Deal): Priority {
  const closed = deal.stage === "WON" || deal.stage === "LOST";
  if (deal.closeDate && !closed) {
    const close = new Date(deal.closeDate).getTime();
    const now = Date.now();
    const dayMs = 86_400_000;
    if (close < now - dayMs) return "overdue";
    if (close < now + 7 * dayMs) return "soon";
  }
  if (Number(deal.value) >= 50_000 && !closed) return "high";
  return null;
}

export function emptyColumnCopy(stage: DealStage): string {
  switch (stage) {
    case "PROSPECT":
      return "No prospects yet";
    case "QUALIFIED":
      return "Nothing qualified yet";
    case "PROPOSAL":
      return "No active proposals";
    case "NEGOTIATION":
      return "No deals in negotiation";
    case "WON":
      return "No closed-won deals yet";
    case "LOST":
      return "No closed-lost deals";
  }
}

export function formatCloseDate(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
