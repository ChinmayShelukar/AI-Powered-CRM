import { useEffect, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { dealsApi } from "@/services/deals";
import { contactsApi } from "@/services/contacts";
import { extractErrorMessage } from "@/services/api";
import type { Deal, DealRequest, DealStage } from "@/types/api";

const STAGE_OPTIONS: DealStage[] = [
  "PROSPECT",
  "QUALIFIED",
  "PROPOSAL",
  "NEGOTIATION",
  "WON",
  "LOST",
];

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  deal?: Deal | null;
}

const empty: DealRequest = { title: "", value: 0, stage: "PROSPECT" };

export function DealFormDialog({ open, onOpenChange, deal }: Props) {
  const isEdit = !!deal;
  const queryClient = useQueryClient();
  const [form, setForm] = useState<DealRequest>(empty);

  const { data: contacts = [] } = useQuery({
    queryKey: ["contacts"],
    queryFn: contactsApi.list,
    enabled: open,
  });

  useEffect(() => {
    if (open) {
      setForm(
        deal
          ? {
              title: deal.title,
              value: deal.value,
              stage: deal.stage,
              closeDate: deal.closeDate ?? undefined,
              contactId: deal.contactId ?? undefined,
            }
          : empty
      );
    }
  }, [open, deal]);

  const mutation = useMutation({
    mutationFn: (req: DealRequest) =>
      isEdit ? dealsApi.update(deal!.id, req) : dealsApi.create(req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deals"] });
      toast.success(isEdit ? "Deal updated" : "Deal created");
      onOpenChange(false);
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    mutation.mutate({
      title: form.title.trim(),
      value: form.value ?? 0,
      stage: form.stage,
      closeDate: form.closeDate || undefined,
      contactId: form.contactId || undefined,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit deal" : "New deal"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the details for this deal."
              : "Add a new deal to your pipeline."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="deal-title">Title</Label>
            <Input
              id="deal-title"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Acme Enterprise Contract"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="deal-value">Value ($)</Label>
              <Input
                id="deal-value"
                type="number"
                min={0}
                step={0.01}
                value={form.value ?? ""}
                onChange={(e) =>
                  setForm({ ...form, value: parseFloat(e.target.value) || 0 })
                }
                placeholder="10000"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="deal-stage">Stage</Label>
              <Select
                value={form.stage}
                onValueChange={(v) => setForm({ ...form, stage: v as DealStage })}
              >
                <SelectTrigger id="deal-stage">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STAGE_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="deal-close">Close date</Label>
              <Input
                id="deal-close"
                type="date"
                value={form.closeDate ?? ""}
                onChange={(e) =>
                  setForm({ ...form, closeDate: e.target.value || undefined })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="deal-contact">Contact</Label>
              <Select
                value={form.contactId ? String(form.contactId) : "__none__"}
                onValueChange={(v) =>
                  setForm({
                    ...form,
                    contactId: v !== "__none__" ? Number(v) : undefined,
                  })
                }
              >
                <SelectTrigger id="deal-contact">
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {contacts.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending
                ? "Saving..."
                : isEdit
                ? "Save changes"
                : "Create deal"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
