import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  Users, Briefcase, TrendingUp, ListChecks,
  AlertCircle, LayoutDashboard, Plus, Search,
  ArrowRight, ArrowUpRight, Clock, Sparkles,
} from "lucide-react";
import { useAuthStore } from "@/store/auth";
import { contactsApi } from "@/services/contacts";
import { dealsApi } from "@/services/deals";
import { activitiesApi } from "@/services/activities";
import { analyticsApi } from "@/services/analytics";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { STAGES, STAGE_BY_KEY } from "@/components/deals/stages";
import { ACTIVITY_META } from "@/components/activities/activityMeta";
import { formatCurrency, formatCurrencyFull } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Deal, Activity, DealStage } from "@/types/api";

function PipelineStrip({ deals, loading }: { deals: Deal[]; loading: boolean }) {
  const rows = useMemo(
    () => STAGES.map((s) => {
      const sd = deals.filter((d) => d.stage === s.key);
      return { ...s, count: sd.length, value: sd.reduce((sum, d) => sum + Number(d.value || 0), 0) };
    }),
    [deals]
  );
  const total = rows.reduce((s, r) => s + r.count, 0) || 1;

  return (
    <Card className="border-border/70 shadow-sm">
      <CardContent className="px-5 py-4">
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-2 w-full rounded-full" />
            <div className="grid grid-cols-6 gap-2">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10" />)}
            </div>
          </div>
        ) : (
          <>
            <div className="flex h-2 w-full gap-px overflow-hidden rounded-full bg-muted">
              {rows.filter((s) => s.count > 0).map((s) => (
                <div key={s.key} className={cn("h-full transition-all", s.dot)}
                  style={{ width: `${(s.count / total) * 100}%` }} />
              ))}
            </div>
            <div className="mt-3 grid grid-cols-6 gap-1">
              {rows.map((s) => (
                <div key={s.key} className="flex min-w-0 flex-col gap-0.5">
                  <div className="flex items-center gap-1 min-w-0">
                    <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", s.dot)} aria-hidden />
                    <span className="truncate text-[11px] text-muted-foreground">{s.label}</span>
                  </div>
                  <span className="text-sm font-bold tabular-nums">{s.count}</span>
                  <span className="text-[11px] text-muted-foreground tabular-nums">{formatCurrency(s.value)}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function RevenueChart({ deals, loading }: { deals: Deal[]; loading: boolean }) {
  const filled = useMemo(() => {
    const now = new Date();
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
      return { label: d.toLocaleDateString("en", { month: "short" }), year: d.getFullYear(), month: d.getMonth(), value: 0 };
    });
    deals.filter((d) => d.stage === "WON" && d.closeDate).forEach((d) => {
      const date = new Date(d.closeDate!);
      const entry = months.find((m) => m.year === date.getFullYear() && m.month === date.getMonth());
      if (entry) entry.value += Number(d.value || 0);
    });
    return months;
  }, [deals]);

  const maxV = Math.max(...filled.map((d) => d.value), 1);
  const total = filled.reduce((s, d) => s + d.value, 0);
  const n = filled.length - 1;
  const VB_W = 300; const VB_H = 100; const CHART_T = 8; const CHART_B = 85; const X_PAD = 6;

  const pts = filled.map((d, i) => ({
    x: X_PAD + (i / n) * (VB_W - X_PAD * 2),
    y: CHART_B - (d.value / maxV) * (CHART_B - CHART_T),
    ...d,
  }));

  const linePath = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const areaPath = `M${pts[0].x.toFixed(1)},${CHART_B} ${linePath.slice(1)} L${pts[n].x.toFixed(1)},${CHART_B} Z`;

  return (
    <Card className="h-full flex flex-col border-border/70 shadow-sm">
      <CardHeader className="shrink-0 px-5 pt-4 pb-2">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Won Revenue</p>
            {loading
              ? <Skeleton className="mt-1.5 h-7 w-28" />
              : <p className="mt-1 text-2xl font-bold tracking-tight tabular-nums">{formatCurrencyFull(total)}</p>
            }
          </div>
          <Badge variant="secondary" className="mt-0.5 shrink-0 text-xs">6 months</Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1 min-h-0 flex flex-col px-5 pb-4 gap-2">
        {loading ? (
          <Skeleton className="flex-1 w-full rounded-lg" />
        ) : (
          <>
            <svg
              viewBox={`0 0 ${VB_W} ${VB_H}`}
              className="w-full flex-1 min-h-0"
              preserveAspectRatio="none"
              aria-hidden
            >
              <defs>
                <linearGradient id="rev-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.01" />
                </linearGradient>
              </defs>
              <path d={areaPath} fill="url(#rev-fill)" />
              <path d={linePath} fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                style={{ stroke: "hsl(var(--primary))" }} />
              {pts.map((p) => (
                <circle key={p.label} cx={p.x} cy={p.y} r="3.5"
                  style={{ fill: "hsl(var(--background))", stroke: "hsl(var(--primary))", strokeWidth: 2 }}>
                  <title>{p.value > 0 ? formatCurrencyFull(p.value) : "—"}</title>
                </circle>
              ))}
            </svg>
            <div className="shrink-0 flex justify-between px-0.5">
              {filled.map((m) => (
                <span key={m.label} className="text-[11px] text-muted-foreground">{m.label}</span>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function RecentActivityCard({ activities, loading }: { activities: Activity[]; loading: boolean }) {
  const navigate = useNavigate();
  const recent = useMemo(
    () => [...activities]
      .sort((a, b) => new Date(b.activityDate).getTime() - new Date(a.activityDate).getTime())
      .slice(0, 4),
    [activities]
  );

  return (
    <Card className="h-full flex flex-col border-border/70 shadow-sm">
      <CardHeader className="shrink-0 px-5 pt-4 pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Recent Activity
          </CardTitle>
          <button onClick={() => navigate("/activities")}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors">
            View all <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 px-5 pb-5">
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-7 w-7 shrink-0 rounded-lg" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : recent.length === 0 ? (
          <p className="text-sm text-muted-foreground">No activities logged yet.</p>
        ) : (
          <ul className="space-y-4">
            {recent.map((a) => {
              const meta = ACTIVITY_META[a.type];
              const Icon = meta.icon;
              return (
                <li key={a.id} className="flex items-start gap-3">
                  <div className={cn("grid h-7 w-7 shrink-0 place-items-center rounded-lg", meta.iconChip)}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium leading-tight">
                      {meta.label}{a.contactName ? ` — ${a.contactName}` : ""}
                    </p>
                    {a.notes && (
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">{a.notes}</p>
                    )}
                  </div>
                  <span className="shrink-0 pt-0.5 text-xs tabular-nums text-muted-foreground">
                    {new Date(a.activityDate).toLocaleDateString([], { month: "short", day: "numeric" })}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function ClosingSoonCard({ deals, loading }: { deals: Deal[]; loading: boolean }) {
  const navigate = useNavigate();
  const closing = useMemo(() => {
    const now = Date.now();
    const limit = now + 30 * 24 * 60 * 60 * 1000;
    return deals
      .filter((d) => {
        if (d.stage === "WON" || d.stage === "LOST" || !d.closeDate) return false;
        const t = new Date(d.closeDate).getTime();
        return t >= now && t <= limit;
      })
      .sort((a, b) => new Date(a.closeDate!).getTime() - new Date(b.closeDate!).getTime())
      .slice(0, 4);
  }, [deals]);

  return (
    <Card className="h-full flex flex-col border-border/70 shadow-sm">
      <CardHeader className="shrink-0 px-5 pt-4 pb-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Closing Soon
            </CardTitle>
            {!loading && closing.length > 0 && (
              <Badge variant="secondary" className="h-4 px-1.5 text-[11px]">{closing.length}</Badge>
            )}
          </div>
          <button onClick={() => navigate("/deals")}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors">
            View all <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 px-5 pb-5">
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-1.5">
                <Skeleton className="h-3.5 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        ) : closing.length === 0 ? (
          <div className="flex flex-col items-center gap-2 pt-4 text-center">
            <Clock className="h-6 w-6 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">No deals closing in 30 days.</p>
          </div>
        ) : (
          <ul className="space-y-4">
            {closing.map((d) => {
              const sm = STAGE_BY_KEY[d.stage as DealStage];
              const daysLeft = Math.round(
                (new Date(d.closeDate!).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
              );
              return (
                <li key={d.id} className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium leading-tight">{d.title}</p>
                    <div className="mt-0.5 flex items-center gap-1.5">
                      <span className={cn("h-1.5 w-1.5 rounded-full", sm.dot)} aria-hidden />
                      <span className="text-xs text-muted-foreground">{sm.label}</span>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-semibold tabular-nums">{formatCurrency(d.value)}</p>
                    <p className={cn("text-xs tabular-nums font-medium",
                      daysLeft <= 7 ? "text-destructive" : "text-muted-foreground")}>
                      {daysLeft === 0 ? "Today!" : daysLeft === 1 ? "1 day" : `${daysLeft}d`}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

type StatTone = "teal" | "sky" | "emerald" | "amber";

const TONE_CHIP: Record<StatTone, string> = {
  teal:    "bg-teal-100    text-teal-700    dark:bg-teal-500/20    dark:text-teal-300",
  sky:     "bg-sky-100     text-sky-700     dark:bg-sky-500/20     dark:text-sky-300",
  emerald: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
  amber:   "bg-amber-100   text-amber-700   dark:bg-amber-500/20   dark:text-amber-300",
};

function StatCard({
  title, value, sub, subPositive, icon: Icon, tone, loading, onClick,
}: {
  title: string; value: string | number; sub: string; subPositive?: boolean;
  icon: React.ComponentType<{ className?: string }>; tone: StatTone;
  loading: boolean; onClick?: () => void;
}) {
  return (
    <Card
      className={cn("border-border/70 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md", onClick && "cursor-pointer")}
      onClick={onClick}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{title}</p>
            {loading
              ? <Skeleton className="mt-2 h-7 w-20" />
              : <p className="mt-2 text-2xl font-bold tracking-tight tabular-nums">{value}</p>
            }
            {loading
              ? <Skeleton className="mt-1.5 h-3 w-28" />
              : (
                <div className="mt-1.5 flex items-center gap-1">
                  <ArrowUpRight className={cn("h-3 w-3 shrink-0",
                    subPositive ? "text-emerald-500" : "text-muted-foreground/40 rotate-90")} />
                  <p className="truncate text-xs text-muted-foreground">{sub}</p>
                </div>
              )
            }
          </div>
          <div className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-xl", TONE_CHIP[tone])}>
            <Icon className="h-4 w-4" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const OPEN_STAGES: DealStage[] = ["PROSPECT", "QUALIFIED", "PROPOSAL", "NEGOTIATION"];

const RFM_TONE: Record<string, string> = {
  "Champion": "bg-emerald-100 text-emerald-700",
  "Loyal": "bg-teal-100 text-teal-700",
  "Potential": "bg-sky-100 text-sky-700",
  "At-Risk": "bg-red-100 text-red-700",
  "Needs-Attention": "bg-amber-100 text-amber-700",
};

const RISK_TONE: Record<string, string> = {
  HIGH: "bg-red-100 text-red-700",
  MEDIUM: "bg-amber-100 text-amber-700",
  LOW: "bg-emerald-100 text-emerald-700",
};

function BriefingCard() {
  const briefing = useQuery({ queryKey: ["analytics", "briefing"], queryFn: analyticsApi.briefing });

  return (
    <Card className="border-primary/30 bg-primary/5 shadow-sm">
      <CardHeader className="px-5 pt-4 pb-2">
        <CardTitle className="text-xs font-medium uppercase tracking-wide text-primary flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5" />
          Daily Briefing
        </CardTitle>
      </CardHeader>
      <CardContent className="px-5 pb-4">
        {briefing.isLoading ? (
          <Skeleton className="h-16 w-full" />
        ) : (
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">{briefing.data?.summary}</p>
            <ol className="space-y-1">
              {(briefing.data?.trace ?? []).map((s) => (
                <li key={s.step} className="flex gap-2 text-xs text-muted-foreground">
                  <span className="font-semibold text-[#a9583e]">{s.step}.</span>
                  <span><span className="font-medium text-foreground/80">{s.action}:</span> {s.detail}</span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function LeaderboardCard({ deals, loading }: { deals: Deal[]; loading: boolean }) {
  // Won revenue per sales rep, top 6, from client-side deal data.
  const data = useMemo(() => {
    const byRep = new Map<string, number>();
    deals.filter((d) => d.stage === "WON").forEach((d) => {
      const rep = d.assignedToUserName ?? "Unassigned";
      byRep.set(rep, (byRep.get(rep) ?? 0) + Number(d.value || 0));
    });
    return Array.from(byRep, ([rep, value]) => ({ rep, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [deals]);

  return (
    <Card className="border-border/70 shadow-sm">
      <CardHeader className="px-5 pt-4 pb-2">
        <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Sales Leaderboard — Won Revenue
        </CardTitle>
      </CardHeader>
      <CardContent className="px-5 pb-4">
        {loading ? (
          <Skeleton className="h-48 w-full" />
        ) : data.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">No won deals yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16, top: 4, bottom: 4 }}>
              <XAxis type="number" tickFormatter={(v) => formatCurrency(Number(v))} fontSize={11} stroke="currentColor" className="text-muted-foreground" />
              <YAxis type="category" dataKey="rep" width={90} fontSize={11} stroke="currentColor" className="text-muted-foreground" />
              <Tooltip formatter={(v) => formatCurrencyFull(Number(v))} cursor={{ fill: "rgba(0,0,0,0.04)" }} />
              <Bar dataKey="value" fill="#cc785c" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

function ChurnRadarCard() {
  const risk = useQuery({ queryKey: ["analytics", "risk"], queryFn: analyticsApi.risk });
  // Show only at-risk contacts (HIGH/MEDIUM), highest first.
  const rows = (risk.data ?? []).filter((r) => r.level !== "LOW").slice(0, 8);

  return (
    <Card className="border-border/70 shadow-sm">
      <CardHeader className="px-5 pt-4 pb-2">
        <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Churn Radar
        </CardTitle>
      </CardHeader>
      <CardContent className="px-5 pb-4">
        {risk.isLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">No at-risk contacts. 🎉</p>
        ) : (
          <ul className="space-y-2">
            {rows.map((r) => (
              <li key={r.contactId} className="flex items-start justify-between gap-3 border-b border-border/40 pb-2 last:border-0">
                <div className="min-w-0">
                  <span className="font-medium text-sm">{r.name}</span>
                  {r.company && <span className="text-muted-foreground text-sm"> · {r.company}</span>}
                  <p className="text-xs text-muted-foreground truncate">{r.reasons.join(" · ")}</p>
                </div>
                <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium", RISK_TONE[r.level])}>
                  {r.level}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

const DEAL_HEALTH_TONE: Record<string, string> = {
  STALLED: "bg-red-100 text-red-700",
  AT_RISK: "bg-amber-100 text-amber-700",
  HEALTHY: "bg-emerald-100 text-emerald-700",
};

function TeamInsightsCard() {
  // Manager/admin only; endpoint 403s otherwise so we gate the query by role.
  const role = useAuthStore((s) => s.role);
  const enabled = role === "ADMIN" || role === "MANAGER";
  const team = useQuery({ queryKey: ["analytics", "team-insights"], queryFn: analyticsApi.teamInsights, enabled });

  if (!enabled) return null;

  return (
    <Card className="border-border/70 shadow-sm">
      <CardHeader className="px-5 pt-4 pb-2">
        <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Team Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="px-5 pb-4 space-y-3">
        {team.isLoading ? (
          <Skeleton className="h-20 w-full" />
        ) : (
          <>
            <p className="text-sm text-foreground/90">{team.data?.narrative}</p>
            <div className="space-y-1">
              {(team.data?.reps ?? []).slice(0, 6).map((r) => (
                <div key={r.userId} className="flex items-center justify-between text-xs border-b border-border/40 pb-1 last:border-0">
                  <span className="font-medium">{r.repName}</span>
                  <span className="text-muted-foreground tabular-nums">
                    {formatCurrency(r.wonRevenue)} won · {r.openDeals} open · {r.activities30d} acts/30d
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function DealHealthCard() {
  const health = useQuery({ queryKey: ["analytics", "deal-health"], queryFn: analyticsApi.dealHealth });
  // Only surface deals needing attention (STALLED/AT_RISK), least healthy first.
  const rows = (health.data ?? []).filter((d) => d.level !== "HEALTHY").slice(0, 8);

  return (
    <Card className="border-border/70 shadow-sm">
      <CardHeader className="px-5 pt-4 pb-2">
        <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Deal Health
        </CardTitle>
      </CardHeader>
      <CardContent className="px-5 pb-4">
        {health.isLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">All open deals on track. 🎉</p>
        ) : (
          <ul className="space-y-2">
            {rows.map((d) => (
              <li key={d.dealId} className="flex items-start justify-between gap-3 border-b border-border/40 pb-2 last:border-0">
                <div className="min-w-0">
                  <span className="font-medium text-sm">{d.title}</span>
                  <span className="text-muted-foreground text-sm"> · {d.stage}</span>
                  <p className="text-xs text-muted-foreground truncate">{d.reasons.join(" · ")}</p>
                </div>
                <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium", DEAL_HEALTH_TONE[d.level])}>
                  {d.level.replace("_", " ")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function RfmCard() {
  const rfm = useQuery({ queryKey: ["analytics", "rfm"], queryFn: analyticsApi.rfm });
  const rows = (rfm.data ?? []).slice(0, 8);

  return (
    <Card className="border-border/70 shadow-sm">
      <CardHeader className="px-5 pt-4 pb-2">
        <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          RFM Customer Segments
        </CardTitle>
      </CardHeader>
      <CardContent className="px-5 pb-4">
        {rfm.isLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">No contact data yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground border-b border-border/60">
                  <th className="py-1.5 pr-3 font-medium">Contact</th>
                  <th className="py-1.5 pr-3 font-medium">Segment</th>
                  <th className="py-1.5 pr-3 font-medium text-right">Recency (d)</th>
                  <th className="py-1.5 pr-3 font-medium text-right">Freq</th>
                  <th className="py-1.5 font-medium text-right">Monetary</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.contactId} className="border-b border-border/40 last:border-0">
                    <td className="py-1.5 pr-3">
                      <span className="font-medium">{r.name}</span>
                      {r.company && <span className="text-muted-foreground"> · {r.company}</span>}
                    </td>
                    <td className="py-1.5 pr-3">
                      <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", RFM_TONE[r.segment] ?? "bg-muted text-foreground")}>
                        {r.segment}
                      </span>
                    </td>
                    <td className="py-1.5 pr-3 text-right tabular-nums">{r.recencyDays >= 9999 ? "—" : r.recencyDays}</td>
                    <td className="py-1.5 pr-3 text-right tabular-nums">{r.frequency}</td>
                    <td className="py-1.5 text-right tabular-nums">{formatCurrency(r.monetary)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const name = useAuthStore((s) => s.name);
  const navigate = useNavigate();

  const contacts   = useQuery({ queryKey: ["contacts"],   queryFn: contactsApi.list });
  const deals      = useQuery({ queryKey: ["deals"],      queryFn: dealsApi.list });
  const activities = useQuery({ queryKey: ["activities"], queryFn: () => activitiesApi.list() });

  const loading  = contacts.isLoading || deals.isLoading || activities.isLoading;
  const hasError = contacts.isError   || deals.isError   || activities.isError;

  const dealsData      = deals.data      ?? [];
  const contactsData   = contacts.data   ?? [];
  const activitiesData = activities.data ?? [];

  const now = new Date();

  const newThisMonth = useMemo(() => contactsData.filter((c) => {
    const d = new Date(c.createdAt);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  }).length, [contactsData]);

  const openDeals     = useMemo(() => dealsData.filter((d) => OPEN_STAGES.includes(d.stage)), [dealsData]);
  const pipelineValue = useMemo(() => openDeals.reduce((s, d) => s + Number(d.value || 0), 0), [openDeals]);
  const wonDeals      = useMemo(() => dealsData.filter((d) => d.stage === "WON"), [dealsData]);
  const wonRevenue    = useMemo(() => wonDeals.reduce((s, d) => s + Number(d.value || 0), 0), [wonDeals]);

  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thisWeekCount = useMemo(
    () => activitiesData.filter((a) => new Date(a.activityDate) >= oneWeekAgo).length,
    [activitiesData]
  );

  const firstName = name?.split(" ")[0] ?? "there";

  return (
    <div className="h-full flex flex-col gap-4 overflow-y-auto">

      {/* Header */}
      <div className="shrink-0 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-gradient text-white shadow-md shadow-primary/25">
            <LayoutDashboard className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-bold tracking-tight leading-tight truncate">
              Welcome back, {firstName}
            </h1>
            <p className="text-sm text-muted-foreground leading-tight">Here's your pipeline at a glance</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={() => navigate("/ai")}
            className="hidden sm:flex items-center gap-2 h-9 w-80 rounded-lg border border-input bg-muted/40 px-3.5 text-muted-foreground hover:border-primary/40 hover:bg-card hover:text-foreground transition-all">
            <Search className="h-3.5 w-3.5 shrink-0" />
            <span className="flex-1 text-left text-sm">Ask AI about your pipeline…</span>
            <Badge variant="secondary" className="text-[11px] px-1.5 py-0 h-4 shrink-0">AI</Badge>
          </button>
          <Button size="sm" className="h-9 gap-1.5" onClick={() => navigate("/deals")}>
            <Plus className="h-3.5 w-3.5" />
            New deal
          </Button>
        </div>
      </div>

      {hasError && (
        <div className="shrink-0 flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/8 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          Failed to load some dashboard data. Please refresh to try again.
        </div>
      )}

      {/* Stat cards */}
      <div className="shrink-0 grid gap-3 grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Contacts" value={contactsData.length}
          sub={newThisMonth > 0 ? `+${newThisMonth} added this month` : "None added this month"}
          subPositive={newThisMonth > 0} icon={Users} tone="teal" loading={loading}
          onClick={() => navigate("/contacts")} />
        <StatCard title="Open Deals" value={openDeals.length}
          sub={pipelineValue > 0 ? `${formatCurrencyFull(pipelineValue)} in pipeline` : "No active pipeline"}
          subPositive={pipelineValue > 0} icon={Briefcase} tone="sky" loading={loading}
          onClick={() => navigate("/deals")} />
        <StatCard title="Won Revenue" value={formatCurrency(wonRevenue)}
          sub={wonDeals.length > 0 ? `${wonDeals.length} deal${wonDeals.length !== 1 ? "s" : ""} closed won` : "No deals won yet"}
          subPositive={wonDeals.length > 0} icon={TrendingUp} tone="emerald" loading={loading}
          onClick={() => navigate("/deals")} />
        <StatCard title="Activities" value={activitiesData.length}
          sub={thisWeekCount > 0 ? `${thisWeekCount} logged this week` : "None logged this week"}
          subPositive={thisWeekCount > 0} icon={ListChecks} tone="amber" loading={loading}
          onClick={() => navigate("/activities")} />
      </div>

      {/* Pipeline strip */}
      <div className="shrink-0">
        <PipelineStrip deals={dealsData} loading={loading} />
      </div>

      {/* Daily briefing agent */}
      <div className="shrink-0">
        <BriefingCard />
      </div>

      {/* Charts row — fixed height, 3 equal columns */}
      <div className="shrink-0 grid gap-3 lg:grid-cols-3 h-[340px]">
        <RevenueChart deals={dealsData} loading={loading} />
        <RecentActivityCard activities={activitiesData} loading={loading} />
        <ClosingSoonCard deals={dealsData} loading={loading} />
      </div>

      {/* RFM segments + churn radar */}
      <div className="shrink-0 grid gap-3 lg:grid-cols-2">
        <RfmCard />
        <ChurnRadarCard />
      </div>

      {/* Deal health + sales leaderboard */}
      <div className="shrink-0 grid gap-3 lg:grid-cols-2">
        <DealHealthCard />
        <LeaderboardCard deals={dealsData} loading={loading} />
      </div>

      {/* Team insights (managers/admins only) */}
      <div className="shrink-0">
        <TeamInsightsCard />
      </div>

    </div>
  );
}
