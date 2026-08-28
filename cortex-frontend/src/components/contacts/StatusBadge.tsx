import { Badge } from "@/components/ui/badge";
import type { ContactStatus } from "@/types/api";
import { cn } from "@/lib/utils";

const styles: Record<ContactStatus, string> = {
  NEW: "bg-blue-100 text-blue-800 hover:bg-blue-100 dark:bg-blue-900/40 dark:text-blue-200",
  CONTACTED: "bg-amber-100 text-amber-800 hover:bg-amber-100 dark:bg-amber-900/40 dark:text-amber-200",
  QUALIFIED: "bg-violet-100 text-violet-800 hover:bg-violet-100 dark:bg-violet-900/40 dark:text-violet-200",
  CUSTOMER: "bg-emerald-100 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-900/40 dark:text-emerald-200",
  LOST: "bg-rose-100 text-rose-800 hover:bg-rose-100 dark:bg-rose-900/40 dark:text-rose-200",
};

export function StatusBadge({ status }: { status: ContactStatus }) {
  return <Badge className={cn("font-medium border-transparent", styles[status])}>{status}</Badge>;
}
