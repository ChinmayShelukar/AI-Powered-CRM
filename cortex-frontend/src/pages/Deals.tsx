import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  pointerWithin,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { Briefcase, Plus } from "lucide-react";
import { toast } from "sonner";
import { dealsApi } from "@/services/deals";
import { extractErrorMessage } from "@/services/api";
import type { Deal, DealStage } from "@/types/api";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { STAGES } from "@/components/deals/stages";
import { DealColumn } from "@/components/deals/DealColumn";
import { DealCardPresentation } from "@/components/deals/DealCard";
import { DealFormDialog } from "@/components/deals/DealFormDialog";
import { DeleteDealDialog } from "@/components/deals/DeleteDealDialog";
import { formatCurrencyFull } from "@/lib/format";

export default function Deals() {
  const queryClient = useQueryClient();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Deal | null>(null);
  const [deleting, setDeleting] = useState<Deal | null>(null);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }
  function openEdit(deal: Deal) {
    setEditing(deal);
    setFormOpen(true);
  }

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["deals"],
    queryFn: dealsApi.list,
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor)
  );

  const dealsByStage = useMemo(() => {
    const map: Record<DealStage, Deal[]> = {
      PROSPECT: [],
      QUALIFIED: [],
      PROPOSAL: [],
      NEGOTIATION: [],
      WON: [],
      LOST: [],
    };
    (data ?? []).forEach((d) => map[d.stage].push(d));
    return map;
  }, [data]);

  const totalPipeline = useMemo(
    () =>
      (data ?? [])
        .filter((d) => d.stage !== "WON" && d.stage !== "LOST")
        .reduce((sum, d) => sum + Number(d.value || 0), 0),
    [data]
  );

  const activeDeal = useMemo(() => {
    if (!activeId) return null;
    const id = Number(activeId.replace("deal-", ""));
    return (data ?? []).find((d) => d.id === id) ?? null;
  }, [activeId, data]);

  const stageMutation = useMutation({
    mutationFn: ({ id, stage }: { id: number; stage: DealStage }) =>
      dealsApi.updateStage(id, stage),
    onMutate: async ({ id, stage }) => {
      await queryClient.cancelQueries({ queryKey: ["deals"] });
      const prev = queryClient.getQueryData<Deal[]>(["deals"]);
      queryClient.setQueryData<Deal[]>(["deals"], (old) =>
        old?.map((d) => (d.id === id ? { ...d, stage } : d))
      );
      return { prev };
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(["deals"], ctx.prev);
      toast.error(extractErrorMessage(err));
    },
    onSuccess: () => toast.success("Stage updated"),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["deals"] }),
  });

  function handleDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
  }

  function handleDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;

    const dealId = Number(String(active.id).replace("deal-", ""));
    const sourceStage = active.data.current?.stage as DealStage | undefined;

    let targetStage: DealStage | undefined;
    const overId = String(over.id);
    if (overId.startsWith("stage-")) {
      targetStage = overId.replace("stage-", "") as DealStage;
    } else if (overId.startsWith("deal-")) {
      targetStage = over.data.current?.stage as DealStage | undefined;
    }

    if (!targetStage || !sourceStage || targetStage === sourceStage) return;
    stageMutation.mutate({ id: dealId, stage: targetStage });
  }

  return (
    <div className="flex h-full flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300">
            <Briefcase className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Deals</h1>
            <p className="text-sm text-muted-foreground">Drag a card across columns to update its stage.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-md border border-border/70 bg-card px-3 py-1.5 text-sm shadow-sm">
            <span className="text-muted-foreground">Open pipeline</span>
            <span className="font-semibold tabular-nums">{formatCurrencyFull(totalPipeline)}</span>
          </div>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            New deal
          </Button>
        </div>
      </div>

      {isError && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {extractErrorMessage(error)}
        </div>
      )}

      {isLoading ? (
        <div className="flex-1 min-h-0 relative -mx-4 md:-mx-8">
          <div className="h-full overflow-x-auto pb-4">
            <div className="flex h-full min-w-max items-stretch gap-5 px-6 md:px-10">
              {STAGES.map((s) => (
                <div
                  key={s.key}
                  className="flex w-[288px] shrink-0 flex-col rounded-lg border border-border/70 bg-muted/30"
                >
                  <div className="border-b border-border/60 px-3 py-2.5">
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <div className="space-y-2 p-2.5">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-24 w-full rounded-md" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : !isError && (data?.length ?? 0) === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border/70 bg-card/50 px-4 py-16 text-center">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-accent text-primary">
            <Briefcase className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold">No deals yet</p>
            <p className="text-sm text-muted-foreground">
              Create your first deal to start tracking your pipeline.
            </p>
          </div>
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            New deal
          </Button>
        </div>
      ) : (
        !isError && (
          <DndContext
            sensors={sensors}
            collisionDetection={pointerWithin}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={() => setActiveId(null)}
          >
            <div className="flex-1 min-h-0 relative -mx-4 md:-mx-8">
              <div
                aria-hidden
                className="pointer-events-none absolute inset-y-0 left-0 z-10 w-6 bg-gradient-to-r from-background via-background/70 to-transparent md:w-10"
              />
              <div
                aria-hidden
                className="pointer-events-none absolute inset-y-0 right-0 z-10 w-6 bg-gradient-to-l from-background via-background/70 to-transparent md:w-10"
              />
              <div
                className="scrollbar-fine scroll-pl-6 h-full overflow-x-auto pb-4 md:scroll-pl-10"
              >
                <div className="flex h-full min-w-max snap-x snap-proximity items-stretch gap-5 px-6 md:px-10">
                  {STAGES.map((s) => (
                    <DealColumn
                      key={s.key}
                      stage={s}
                      deals={dealsByStage[s.key]}
                      onEdit={openEdit}
                      onDelete={setDeleting}
                    />
                  ))}
                </div>
              </div>
            </div>

            <DragOverlay
              dropAnimation={{ duration: 180, easing: "cubic-bezier(0.2, 0, 0, 1)" }}
            >
              {activeDeal ? (
                <div className="w-[268px]">
                  <DealCardPresentation deal={activeDeal} overlay />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        )
      )}

      <DealFormDialog open={formOpen} onOpenChange={setFormOpen} deal={editing} />
      <DeleteDealDialog
        open={!!deleting}
        onOpenChange={(v) => !v && setDeleting(null)}
        deal={deleting}
      />
    </div>
  );
}
