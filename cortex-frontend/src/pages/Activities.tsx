import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ListChecks, Plus } from "lucide-react";
import { activitiesApi } from "@/services/activities";
import { extractErrorMessage } from "@/services/api";
import { useAuthStore } from "@/store/auth";
import type { Activity, ActivityType } from "@/types/api";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ACTIVITY_TYPES, dayBucketLabel } from "@/components/activities/activityMeta";
import { ActivityItem } from "@/components/activities/ActivityItem";
import { ActivityFormDialog } from "@/components/activities/ActivityFormDialog";
import { DeleteActivityDialog } from "@/components/activities/DeleteActivityDialog";

const ALL = "ALL" as const;
type Filter = ActivityType | typeof ALL;

interface DayGroup {
  label: string;
  iso: string;
  items: Activity[];
}

function groupByDay(items: Activity[]): DayGroup[] {
  const buckets = new Map<string, DayGroup>();
  for (const a of items) {
    const d = new Date(a.activityDate);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    let group = buckets.get(key);
    if (!group) {
      group = { label: dayBucketLabel(a.activityDate), iso: a.activityDate, items: [] };
      buckets.set(key, group);
    }
    group.items.push(a);
  }
  return Array.from(buckets.values()).sort(
    (a, b) => new Date(b.iso).getTime() - new Date(a.iso).getTime()
  );
}

export default function Activities() {
  const role = useAuthStore((s) => s.role);
  const userId = useAuthStore((s) => s.userId);
  const isAdminOrManager = role === "ADMIN" || role === "MANAGER";
  const canDelete = role === "ADMIN";

  const [filter, setFilter] = useState<Filter>(ALL);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Activity | null>(null);
  const [deleting, setDeleting] = useState<Activity | null>(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["activities"],
    queryFn: () => activitiesApi.list(),
  });

  function openEdit(a: Activity) {
    setEditing(a);
    setFormOpen(true);
  }
  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }
  function canEditActivity(a: Activity): boolean {
    return isAdminOrManager || a.createdByUserId === userId;
  }

  const filtered = useMemo(() => {
    const sorted = [...(data ?? [])].sort(
      (a, b) => new Date(b.activityDate).getTime() - new Date(a.activityDate).getTime()
    );
    return filter === ALL ? sorted : sorted.filter((a) => a.type === filter);
  }, [data, filter]);

  const groups = useMemo(() => groupByDay(filtered), [filtered]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
            <ListChecks className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Activities</h1>
            <p className="text-sm text-muted-foreground">Calls, emails, meetings, and notes across your pipeline.</p>
          </div>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Log activity
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Select value={filter} onValueChange={(v) => setFilter(v as Filter)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All types</SelectItem>
            {ACTIVITY_TYPES.map((t) => (
              <SelectItem key={t.key} value={t.key}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {data && (
          <span className="text-xs text-muted-foreground">
            {filtered.length} {filtered.length === 1 ? "activity" : "activities"}
          </span>
        )}
      </div>

      {isError && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {extractErrorMessage(error)}
        </div>
      )}

      {isLoading && (
        <div className="space-y-6">
          {Array.from({ length: 2 }).map((_, gi) => (
            <div key={gi} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <div className="overflow-hidden rounded-lg border border-border/70 bg-card shadow-sm">
                {Array.from({ length: 3 }).map((__, i) => (
                  <div key={i} className="flex gap-3 border-b border-border/60 px-3 py-3 last:border-b-0">
                    <Skeleton className="h-8 w-8 rounded-md" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-2/3" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && !isError && groups.length === 0 && (
        <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed border-border/70 bg-card/50 px-4 py-20 text-center">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-accent text-primary">
            <ListChecks className="h-5 w-5" />
          </div>
          <div className="max-w-sm space-y-1">
            <p className="text-sm font-semibold text-foreground">
              {data && data.length === 0 ? "No activity yet" : "No matches"}
            </p>
            <p className="text-sm text-muted-foreground">
              {data && data.length === 0
                ? "Log your first call, email, or meeting to start a paper trail."
                : "Try a different type filter."}
            </p>
          </div>
          {data && data.length === 0 && (
            <Button size="sm" onClick={openCreate}>
              <Plus className="h-4 w-4" />
              Log activity
            </Button>
          )}
        </div>
      )}

      {!isLoading && !isError && groups.length > 0 && (
        <div className="space-y-6">
          {groups.map((g) => (
            <section key={g.iso} className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {g.label}
                </span>
                <span className="h-px flex-1 bg-border/70" />
                <span className="text-xs tabular-nums text-muted-foreground">
                  {g.items.length}
                </span>
              </div>
              <div className="overflow-hidden rounded-lg border border-border/70 bg-card/60 shadow-sm">
                {g.items.map((a, i) => (
                  <div
                    key={a.id}
                    className={i < g.items.length - 1 ? "border-b border-border/60" : ""}
                  >
                    <ActivityItem
                      activity={a}
                      canEdit={canEditActivity(a)}
                      canDelete={canDelete}
                      onEdit={openEdit}
                      onDelete={setDeleting}
                    />
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <ActivityFormDialog
        open={formOpen}
        onOpenChange={(v) => {
          setFormOpen(v);
          if (!v) setEditing(null);
        }}
        activity={editing}
      />
      <DeleteActivityDialog
        open={!!deleting}
        onOpenChange={(v) => !v && setDeleting(null)}
        activity={deleting}
      />
    </div>
  );
}
