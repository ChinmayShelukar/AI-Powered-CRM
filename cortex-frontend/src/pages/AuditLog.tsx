import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Shield, ChevronDown, ChevronRight, ChevronLeft } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { auditApi } from "@/services/audit";
import type { AuditLog, AuditAction } from "@/types/api";

const ACTION_STYLE: Record<AuditAction, string> = {
  CREATE: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  UPDATE: "bg-amber-100  text-amber-700  dark:bg-amber-500/15  dark:text-amber-300",
  DELETE: "bg-red-100    text-red-700    dark:bg-red-500/15    dark:text-red-300",
};

const ENTITY_STYLE: Record<string, string> = {
  Contact:  "bg-teal-100   text-teal-700   dark:bg-teal-500/15   dark:text-teal-300",
  Deal:     "bg-sky-100    text-sky-700    dark:bg-sky-500/15    dark:text-sky-300",
  Activity: "bg-sky-100    text-sky-700    dark:bg-sky-500/15    dark:text-sky-300",
  User:     "bg-slate-100  text-slate-700  dark:bg-slate-500/15  dark:text-slate-300",
};

function formatTs(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })
    + " · "
    + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function JsonDiff({ label, raw }: { label: string; raw: string | null }) {
  if (!raw) {
    return (
      <div className="min-w-0 flex-1">
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <div className="rounded-md border border-border/60 bg-muted/40 px-3 py-2 text-xs italic text-muted-foreground">
          none
        </div>
      </div>
    );
  }

  let parsed: unknown;
  let display: string;
  try {
    parsed = JSON.parse(raw);
    display = JSON.stringify(parsed, null, 2);
  } catch {
    display = raw;
  }

  return (
    <div className="min-w-0 flex-1">
      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <pre className="overflow-x-auto rounded-md border border-border/60 bg-muted/50 p-3 text-[11px] leading-relaxed text-foreground">
        {display}
      </pre>
    </div>
  );
}

function AuditRow({ log }: { log: AuditLog }) {
  const [open, setOpen] = useState(false);
  const hasDiff = log.oldValue || log.newValue;
  const entityStyle = ENTITY_STYLE[log.entityType] ?? "bg-muted text-muted-foreground";

  return (
    <>
      <tr
        onClick={() => hasDiff && setOpen((o) => !o)}
        className={cn(
          "border-b border-border/40 text-sm transition-colors",
          hasDiff
            ? "cursor-pointer hover:bg-muted/40"
            : "cursor-default"
        )}
      >
        {/* expand toggle */}
        <td className="w-8 py-3 pl-4 pr-0">
          {hasDiff ? (
            open
              ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
          ) : (
            <span className="inline-block h-3.5 w-3.5" />
          )}
        </td>

        {/* timestamp */}
        <td className="whitespace-nowrap py-3 pr-4 tabular-nums text-muted-foreground">
          {formatTs(log.occurredAt)}
        </td>

        {/* user */}
        <td className="max-w-[180px] truncate py-3 pr-4 text-foreground" title={log.userEmail ?? "—"}>
          {log.userEmail ?? <span className="italic text-muted-foreground">system</span>}
        </td>

        {/* action */}
        <td className="py-3 pr-4">
          <span className={cn(
            "inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium",
            ACTION_STYLE[log.action]
          )}>
            {log.action}
          </span>
        </td>

        {/* entity type */}
        <td className="py-3 pr-4">
          <span className={cn(
            "inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium",
            entityStyle
          )}>
            {log.entityType}
          </span>
        </td>

        {/* entity id */}
        <td className="py-3 pr-4 tabular-nums text-muted-foreground">
          #{log.entityId}
        </td>
      </tr>

      {/* expandable diff row */}
      {open && hasDiff && (
        <tr className="border-b border-border/40 bg-muted/20">
          <td colSpan={6} className="px-4 py-3">
            <div className="flex gap-4">
              <JsonDiff label="Before" raw={log.oldValue} />
              <JsonDiff label="After"  raw={log.newValue} />
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

const ENTITY_TYPES = ["Contact", "Deal", "Activity", "User"];
const ACTIONS: AuditAction[] = ["CREATE", "UPDATE", "DELETE"];

export default function AuditLog() {
  const [actionFilter, setActionFilter] = useState<string>("ALL");
  const [entityFilter, setEntityFilter] = useState<string>("ALL");
  const [page, setPage]                 = useState(0);
  const PAGE_SIZE = 20;

  const { data, isLoading, isError } = useQuery({
    queryKey: ["audit", page],
    queryFn: () => auditApi.list({ page, size: PAGE_SIZE }),
  });

  const filtered = (data?.content ?? []).filter((log) => {
    if (actionFilter !== "ALL" && log.action !== actionFilter) return false;
    if (entityFilter !== "ALL" && log.entityType !== entityFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-teal-100 text-teal-800 ring-1 ring-inset ring-teal-300/60 dark:bg-teal-500/10 dark:text-teal-300 dark:ring-teal-400/20">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Audit Log</h1>
            <p className="text-sm text-muted-foreground">
              Every create, update, and delete — in order
            </p>
          </div>
        </div>

        {/* filters */}
        <div className="flex items-center gap-2">
          <Select value={actionFilter} onValueChange={(v) => { setActionFilter(v); setPage(0); }}>
            <SelectTrigger className="h-8 w-36 text-xs">
              <SelectValue placeholder="Action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All actions</SelectItem>
              {ACTIONS.map((a) => (
                <SelectItem key={a} value={a}>{a}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={entityFilter} onValueChange={(v) => { setEntityFilter(v); setPage(0); }}>
            <SelectTrigger className="h-8 w-36 text-xs">
              <SelectValue placeholder="Entity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All entities</SelectItem>
              {ENTITY_TYPES.map((e) => (
                <SelectItem key={e} value={e}>{e}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {(actionFilter !== "ALL" || entityFilter !== "ALL") && (
            <Badge variant="secondary" className="tabular-nums">
              {filtered.length} result{filtered.length !== 1 ? "s" : ""}
            </Badge>
          )}
        </div>
      </div>

      {/* table */}
      <div className="overflow-hidden rounded-xl border border-border/70 bg-card shadow-sm">
        {isLoading ? (
          <div className="space-y-0">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 border-b border-border/40 px-4 py-3">
                <Skeleton className="h-3.5 w-3.5 rounded" />
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-5 w-16 rounded-md" />
                <Skeleton className="h-5 w-20 rounded-md" />
                <Skeleton className="h-4 w-8" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Failed to load audit log.
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <Shield className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No entries match the current filters.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 bg-muted/40">
                <th className="w-8 py-2.5 pl-4 pr-0" />
                <th className="py-2.5 pr-4 text-left text-xs font-medium text-muted-foreground">Time</th>
                <th className="py-2.5 pr-4 text-left text-xs font-medium text-muted-foreground">User</th>
                <th className="py-2.5 pr-4 text-left text-xs font-medium text-muted-foreground">Action</th>
                <th className="py-2.5 pr-4 text-left text-xs font-medium text-muted-foreground">Entity</th>
                <th className="py-2.5 pr-4 text-left text-xs font-medium text-muted-foreground">ID</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((log) => (
                <AuditRow key={log.id} log={log} />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {!isLoading && !isError && data && data.totalElements > 0 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground tabular-nums">
          <span>
            {filtered.length} match{filtered.length !== 1 ? "es" : ""} on this page
            &nbsp;·&nbsp;
            {data.totalElements} total entr{data.totalElements !== 1 ? "ies" : "y"}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="grid h-7 w-7 place-items-center rounded-md border border-border/60 bg-card transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-40"
              aria-label="Previous page"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <span>Page {page + 1} of {data.totalPages}</span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={!data.hasNext}
              className="grid h-7 w-7 place-items-center rounded-md border border-border/60 bg-card transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-40"
              aria-label="Next page"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
