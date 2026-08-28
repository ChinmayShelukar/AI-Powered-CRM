import { Briefcase, MoreHorizontal, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getInitials } from "@/lib/format";
import { ACTIVITY_META, formatTimeOfDay } from "./activityMeta";
import type { Activity } from "@/types/api";

const SENTIMENT_TONE: Record<string, string> = {
  POSITIVE: "bg-emerald-100 text-emerald-700",
  NEUTRAL: "bg-slate-100 text-slate-600",
  NEGATIVE: "bg-red-100 text-red-700",
};

interface Props {
  activity: Activity;
  canEdit?: boolean;
  canDelete?: boolean;
  onEdit?: (a: Activity) => void;
  onDelete?: (a: Activity) => void;
}

export function ActivityItem({ activity, canEdit, canDelete, onEdit, onDelete }: Props) {
  const meta = ACTIVITY_META[activity.type];
  const Icon = meta.icon;
  const showMenu = !!(canEdit || canDelete);

  return (
    <div className="group flex gap-3 px-3 py-3 transition-colors duration-150 hover:bg-muted/40">
      <div
        className={cn(
          "mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-md",
          meta.iconChip
        )}
      >
        <Icon className="h-4 w-4" />
      </div>

      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-sm">
          <span className="inline-flex items-center gap-1.5">
            <Avatar className="h-5 w-5">
              <AvatarFallback className="bg-secondary text-[10px] font-medium text-secondary-foreground">
                {getInitials(activity.createdByUserName)}
              </AvatarFallback>
            </Avatar>
            <span className="font-medium text-foreground">{activity.createdByUserName}</span>
          </span>
          <span className="text-muted-foreground">{meta.verb}</span>
          {activity.contactName ? (
            <span className="font-medium text-foreground">{activity.contactName}</span>
          ) : (
            <span className="italic text-muted-foreground">a record</span>
          )}
          <span className="ml-auto inline-flex shrink-0 items-center gap-1 text-xs tabular-nums text-muted-foreground">
            {formatTimeOfDay(activity.activityDate)}
          </span>
        </div>

        {activity.notes && (
          <p className="whitespace-pre-line break-words text-sm text-muted-foreground">
            {activity.notes}
          </p>
        )}

        {(activity.sentiment || activity.intent) && (
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            {activity.sentiment && (
              <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", SENTIMENT_TONE[activity.sentiment])}>
                {activity.sentiment}
              </span>
            )}
            {activity.intent && activity.intent !== "OTHER" && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-foreground">
                {activity.intent}
              </span>
            )}
          </div>
        )}

        {(activity.dealTitle || activity.contactName) && (
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            {activity.dealTitle && (
              <span className="inline-flex items-center gap-1 rounded-md border border-border/70 bg-card px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                <Briefcase className="h-3 w-3" />
                <span className="max-w-[200px] truncate">{activity.dealTitle}</span>
              </span>
            )}
            {activity.contactName && !activity.dealTitle && (
              <span className="inline-flex items-center gap-1 rounded-md border border-border/70 bg-card px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                <User className="h-3 w-3" />
                {activity.contactName}
              </span>
            )}
          </div>
        )}
      </div>

      {showMenu && (
        <div className="self-start">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 opacity-0 transition-opacity duration-150 group-hover:opacity-100 data-[state=open]:opacity-100"
              >
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Activity actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {canEdit && (
                <DropdownMenuItem onClick={() => onEdit?.(activity)}>Edit</DropdownMenuItem>
              )}
              {canEdit && canDelete && <DropdownMenuSeparator />}
              {canDelete && (
                <DropdownMenuItem
                  onClick={() => onDelete?.(activity)}
                  className="text-destructive focus:text-destructive"
                >
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );
}
