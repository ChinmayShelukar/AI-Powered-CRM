import type { DealStage } from "@/types/api";

export interface StageMeta {
  key: DealStage;
  label: string;
  dot: string;
  accent: string;
}

export const STAGES: StageMeta[] = [
  { key: "PROSPECT", label: "Prospect", dot: "bg-slate-400", accent: "before:bg-slate-400" },
  { key: "QUALIFIED", label: "Qualified", dot: "bg-teal-500", accent: "before:bg-teal-500" },
  { key: "PROPOSAL", label: "Proposal", dot: "bg-[#cc785c]", accent: "before:bg-[#cc785c]" },
  { key: "NEGOTIATION", label: "Negotiation", dot: "bg-amber-500", accent: "before:bg-amber-500" },
  { key: "WON", label: "Won", dot: "bg-emerald-500", accent: "before:bg-emerald-500" },
  { key: "LOST", label: "Lost", dot: "bg-rose-500", accent: "before:bg-rose-500" },
];

export const STAGE_BY_KEY: Record<DealStage, StageMeta> = STAGES.reduce(
  (acc, s) => ((acc[s.key] = s), acc),
  {} as Record<DealStage, StageMeta>
);
