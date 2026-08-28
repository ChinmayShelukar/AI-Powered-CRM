import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Briefcase, ListChecks, UserPlus, type LucideIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useNotificationStore, type AppNotification } from "@/store/notifications";
import { formatRelativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { NotificationPayload } from "@/types/api";

interface Resolved {
  icon: LucideIcon;
  iconChip: string;
  title: string;
  detail?: string;
  href?: string;
}

function resolve(payload: NotificationPayload): Resolved {
  switch (payload.type) {
    case "deal.stage.changed":
      return {
        icon: Briefcase,
        iconChip: "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",
        title: payload.data.dealTitle,
        detail: `Moved to ${payload.data.toStage}`,
        href: "/deals",
      };
    case "activity.logged":
      return {
        icon: ListChecks,
        iconChip: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
        title: `New ${payload.data.type.toLowerCase()} logged`,
        detail: "On a record assigned to you",
        href: "/activities",
      };
    case "contact.assigned":
      return {
        icon: UserPlus,
        iconChip: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
        title: `${payload.data.contactName} assigned to you`,
        href: "/contacts",
      };
  }
}

export function NotificationBell() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const items = useNotificationStore((s) => s.items);
  const markAllRead = useNotificationStore((s) => s.markAllRead);
  const clear = useNotificationStore((s) => s.clear);
  const unread = items.filter((i) => !i.read).length;

  function handleOpenChange(v: boolean) {
    setOpen(v);
    if (v && unread > 0) {
      // Mark as read when the dropdown is opened.
      setTimeout(markAllRead, 200);
    }
  }

  function handleItemClick(_n: AppNotification, href?: string) {
    setOpen(false);
    if (href) navigate(href);
  }

  return (
    <DropdownMenu open={open} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 rounded-full"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute right-1.5 top-1.5 grid h-4 min-w-[1rem] place-items-center rounded-full bg-destructive px-1 text-[10px] font-semibold leading-none text-destructive-foreground">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[360px] p-0">
        <div className="flex items-center justify-between border-b border-border/70 px-4 py-2.5">
          <p className="text-sm font-semibold">Notifications</p>
          {items.length > 0 && (
            <button
              type="button"
              onClick={clear}
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              Clear all
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-accent text-primary">
              <Bell className="h-4 w-4" />
            </div>
            <p className="text-sm font-medium">You&apos;re all caught up</p>
            <p className="text-xs text-muted-foreground">
              Stage changes and new activity will show up here.
            </p>
          </div>
        ) : (
          <div className="max-h-[420px] overflow-y-auto py-1">
            {items.map((n) => {
              const r = resolve(n.payload);
              const Icon = r.icon;
              return (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => handleItemClick(n, r.href)}
                  className={cn(
                    "group flex w-full items-start gap-3 px-3 py-2.5 text-left transition-colors hover:bg-muted/40",
                    !n.read && "bg-accent/30"
                  )}
                >
                  <div
                    className={cn(
                      "mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-md",
                      r.iconChip
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <p className="truncate text-sm font-medium">{r.title}</p>
                    {r.detail && (
                      <p className="truncate text-xs text-muted-foreground">{r.detail}</p>
                    )}
                    <p className="text-[11px] text-muted-foreground">
                      {formatRelativeTime(n.receivedAt)}
                    </p>
                  </div>
                  {!n.read && (
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
