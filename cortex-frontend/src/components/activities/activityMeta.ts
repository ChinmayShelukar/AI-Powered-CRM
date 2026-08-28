import { Phone, Mail, Users, StickyNote, type LucideIcon } from "lucide-react";
import type { ActivityType } from "@/types/api";

export interface ActivityMeta {
  key: ActivityType;
  label: string;
  verb: string;
  icon: LucideIcon;
  iconChip: string;
}

export const ACTIVITY_TYPES: ActivityMeta[] = [
  {
    key: "CALL",
    label: "Call",
    verb: "logged a call with",
    icon: Phone,
    iconChip: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
  },
  {
    key: "EMAIL",
    label: "Email",
    verb: "emailed",
    icon: Mail,
    iconChip: "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",
  },
  {
    key: "MEETING",
    label: "Meeting",
    verb: "met with",
    icon: Users,
    iconChip: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  },
  {
    key: "NOTE",
    label: "Note",
    verb: "added a note on",
    icon: StickyNote,
    iconChip: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
  },
];

export const ACTIVITY_META: Record<ActivityType, ActivityMeta> = ACTIVITY_TYPES.reduce(
  (acc, t) => ((acc[t.key] = t), acc),
  {} as Record<ActivityType, ActivityMeta>
);

const TODAY_LABEL = "Today";
const YESTERDAY_LABEL = "Yesterday";

export function dayBucketLabel(iso: string): string {
  const d = new Date(iso);
  const day = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const today = new Date();
  const todayDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const diffDays = Math.round((todayDay - day) / 86_400_000);

  if (diffDays === 0) return TODAY_LABEL;
  if (diffDays === 1) return YESTERDAY_LABEL;
  if (diffDays > 1 && diffDays < 7) {
    return d.toLocaleDateString("en-US", { weekday: "long" });
  }
  if (d.getFullYear() === today.getFullYear()) {
    return d.toLocaleDateString("en-US", { month: "long", day: "numeric" });
  }
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

export function formatTimeOfDay(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}
