import { forwardRef, type HTMLAttributes } from "react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { CalendarClock, Flame, AlertTriangle, Clock3, MoreHorizontal } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { formatCurrency, formatRelativeTime, getInitials } from "@/lib/format";
import {
  companyChipClass,
  companyInitial,
  dealPriority,
  formatCloseDate,
} from "./dealUtils";
import type { Deal } from "@/types/api";

const PRIORITY_STYLES = {
  high: {
    label: "High value",
    icon: Flame,
    cls: "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",
  },
  soon: {
    label: "Closing soon",
    icon: Clock3,
    cls: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
  },
  overdue: {
    label: "Overdue",
    icon: AlertTriangle,
    cls: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
  },
} as const;

interface PresentationProps extends HTMLAttributes<HTMLDivElement> {
  deal: Deal;
  dragging?: boolean;
  overlay?: boolean;
  onEdit?: (deal: Deal) => void;
  onDelete?: (deal: Deal) => void;
}

export const DealCardPresentation = forwardRef<HTMLDivElement, PresentationProps>(
  ({ deal, dragging, overlay, onEdit, onDelete, className, style, ...rest }, ref) => {
    const priority = dealPriority(deal);
    const closeText = formatCloseDate(deal.closeDate);
    const company = deal.contactName;

    const interactive = !dragging && !overlay;
    const mergedStyle =
      dragging || overlay ? { willChange: "transform" as const, ...style } : style;

    return (
      <div
        ref={ref}
        className={cn(
          "group relative cursor-grab select-none rounded-md border border-border/70 bg-card p-3 shadow-sm outline-none",
          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          interactive &&
            "transition-[box-shadow,border-color,transform] duration-150 hover:-translate-y-px hover:border-border hover:shadow-md",
          dragging && "opacity-40",
          overlay &&
            "scale-[1.015] cursor-grabbing border-primary/30 shadow-xl ring-1 ring-primary/20",
          className
        )}
        style={mergedStyle}
        {...rest}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            {priority && (
              <div className="mb-2 flex items-center gap-1.5">
                {(() => {
                  const meta = PRIORITY_STYLES[priority];
                  const Icon = meta.icon;
                  return (
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium",
                        meta.cls
                      )}
                    >
                      <Icon className="h-3 w-3" />
                      {meta.label}
                    </span>
                  );
                })()}
              </div>
            )}
            <p className="line-clamp-2 text-sm font-medium leading-snug text-foreground">
              {deal.title}
            </p>
          </div>

          {interactive && (onEdit || onDelete) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="h-3.5 w-3.5" />
                  <span className="sr-only">Actions</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onEdit && (
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(deal); }}>
                    Edit
                  </DropdownMenuItem>
                )}
                {onEdit && onDelete && <DropdownMenuSeparator />}
                {onDelete && (
                  <DropdownMenuItem
                    onClick={(e) => { e.stopPropagation(); onDelete(deal); }}
                    className="text-destructive focus:text-destructive"
                  >
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {company && (
          <div className="mt-2 flex items-center gap-2">
            <span
              className={cn(
                "grid h-5 w-5 shrink-0 place-items-center rounded text-[10px] font-semibold",
                companyChipClass(company)
              )}
              aria-hidden
            >
              {companyInitial(company)}
            </span>
            <span className="truncate text-xs text-muted-foreground">{company}</span>
          </div>
        )}

        <div className="mt-3 border-t border-border/60 pt-2.5">
          <div className="flex items-center justify-between">
            <span className="text-base font-semibold tabular-nums text-foreground">
              {formatCurrency(deal.value)}
            </span>
            <Avatar className="h-6 w-6">
              <AvatarFallback className="bg-secondary text-[10px] font-medium text-secondary-foreground">
                {getInitials(deal.assignedToUserName)}
              </AvatarFallback>
            </Avatar>
          </div>

          <div className="mt-1.5 flex items-center justify-between text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <CalendarClock className="h-3 w-3" />
              {formatRelativeTime(deal.updatedAt)}
            </span>
            {closeText && <span>Closes {closeText}</span>}
          </div>
        </div>
      </div>
    );
  }
);
DealCardPresentation.displayName = "DealCardPresentation";

interface DealCardProps {
  deal: Deal;
  onEdit?: (deal: Deal) => void;
  onDelete?: (deal: Deal) => void;
}

export function DealCard({ deal, onEdit, onDelete }: DealCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `deal-${deal.id}`,
    data: { dealId: deal.id, stage: deal.stage },
  });

  const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined;

  return (
    <DealCardPresentation
      ref={setNodeRef}
      deal={deal}
      dragging={isDragging}
      onEdit={onEdit}
      onDelete={onDelete}
      style={style}
      {...attributes}
      {...listeners}
    />
  );
}
