import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";
import type { Deal } from "@/types/api";
import type { StageMeta } from "./stages";
import { DealCard } from "./DealCard";
import { emptyColumnCopy } from "./dealUtils";

interface Props {
  stage: StageMeta;
  deals: Deal[];
  onEdit?: (deal: Deal) => void;
  onDelete?: (deal: Deal) => void;
}

export function DealColumn({ stage, deals, onEdit, onDelete }: Props) {
  const { setNodeRef, isOver } = useDroppable({
    id: `stage-${stage.key}`,
    data: { stage: stage.key },
  });

  const total = deals.reduce((sum, d) => sum + Number(d.value || 0), 0);

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex h-full min-h-[420px] w-[288px] shrink-0 snap-start flex-col overflow-hidden rounded-lg border border-border/70 bg-muted/30 transition-colors duration-150",
        isOver && "border-primary/40 bg-accent/40 ring-1 ring-primary/20"
      )}
    >
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border bg-muted px-3 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className={cn("h-2.5 w-2.5 shrink-0 rounded-full ring-2 ring-background", stage.dot)}
            aria-hidden
          />
          <span className="truncate text-[13px] font-semibold uppercase tracking-wide text-foreground">
            {stage.label}
          </span>
          <span className="rounded-full bg-background px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-muted-foreground">
            {deals.length}
          </span>
        </div>
        <span className="shrink-0 text-xs font-medium tabular-nums text-muted-foreground">
          {formatCurrency(total)}
        </span>
      </div>

      <div
        data-column-body
        className="scrollbar-fine relative flex-1 space-y-2 overflow-y-auto overscroll-contain px-2.5 pb-2.5 pt-3"
      >
        {deals.length === 0 ? (
          <div className="flex h-24 items-center justify-center rounded-md border border-dashed border-border/60 px-2 text-center text-xs text-muted-foreground">
            {emptyColumnCopy(stage.key)}
          </div>
        ) : (
          deals.map((d) => (
            <DealCard key={d.id} deal={d} onEdit={onEdit} onDelete={onDelete} />
          ))
        )}
      </div>
    </div>
  );
}
