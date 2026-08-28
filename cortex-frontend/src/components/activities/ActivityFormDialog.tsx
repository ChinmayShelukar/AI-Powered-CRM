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
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { activitiesApi } from "@/services/activities";
import { contactsApi } from "@/services/contacts";
import { dealsApi } from "@/services/deals";
import { extractErrorMessage } from "@/services/api";
import { ACTIVITY_TYPES } from "./activityMeta";
import type { Activity, ActivityRequest, ActivityType } from "@/types/api";

const NONE = "__none__";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  activity?: Activity | null;
  defaultContactId?: number;
  defaultDealId?: number;
}

function nowLocalIso(): string {
  // value for <input type="datetime-local"> -> "YYYY-MM-DDTHH:mm"
  const d = new Date();
  const off = d.getTimezoneOffset();
  const local = new Date(d.getTime() - off * 60_000);
  return local.toISOString().slice(0, 16);
}

function isoToLocalInput(iso: string): string {
  const d = new Date(iso);
  const off = d.getTimezoneOffset();
  const local = new Date(d.getTime() - off * 60_000);
  return local.toISOString().slice(0, 16);
}

export function ActivityFormDialog({
  open,
  onOpenChange,
  activity,
  defaultContactId,
  defaultDealId,
}: Props) {
  const isEdit = !!activity;
  const queryClient = useQueryClient();
  const [type, setType] = useState<ActivityType>("CALL");
  const [activityDate, setActivityDate] = useState<string>(nowLocalIso());
  const [contactId, setContactId] = useState<string>(NONE);
  const [dealId, setDealId] = useState<string>(NONE);
  const [notes, setNotes] = useState("");

  const contactsQuery = useQuery({
    queryKey: ["contacts"],
    queryFn: contactsApi.list,
    enabled: open,
  });
  const dealsQuery = useQuery({
    queryKey: ["deals"],
    queryFn: dealsApi.list,
    enabled: open,
  });

  useEffect(() => {
    if (open) {
      if (activity) {
        setType(activity.type);
        setActivityDate(isoToLocalInput(activity.activityDate));
        setContactId(activity.contactId ? String(activity.contactId) : NONE);
        setDealId(activity.dealId ? String(activity.dealId) : NONE);
        setNotes(activity.notes ?? "");
      } else {
        setType("CALL");
        setActivityDate(nowLocalIso());
        setContactId(defaultContactId ? String(defaultContactId) : NONE);
        setDealId(defaultDealId ? String(defaultDealId) : NONE);
        setNotes("");
      }
    }
  }, [open, activity, defaultContactId, defaultDealId]);

  const mutation = useMutation({
    mutationFn: (req: ActivityRequest) =>
      isEdit ? activitiesApi.update(activity!.id, req) : activitiesApi.create(req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activities"] });
      toast.success(isEdit ? "Activity updated" : "Activity logged");
      onOpenChange(false);
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (contactId === NONE && dealId === NONE) {
      toast.error("Link this activity to a contact or a deal.");
      return;
    }
    const payload: ActivityRequest = {
      type,
      notes: notes.trim() || undefined,
      activityDate: activityDate ? new Date(activityDate).toISOString() : undefined,
      contactId: contactId === NONE ? undefined : Number(contactId),
      dealId: dealId === NONE ? undefined : Number(dealId),
    };
    mutation.mutate(payload);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit activity" : "Log activity"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the details of this activity."
              : "Record a call, email, meeting, or note against a contact or deal."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="type">Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as ActivityType)}>
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACTIVITY_TYPES.map((t) => (
                    <SelectItem key={t.key} value={t.key}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="activityDate">When</Label>
              <Input
                id="activityDate"
                type="datetime-local"
                value={activityDate}
                onChange={(e) => setActivityDate(e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="contact">Contact</Label>
              <Select value={contactId} onValueChange={setContactId}>
                <SelectTrigger id="contact">
                  <SelectValue placeholder="Select a contact" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>None</SelectItem>
                  {(contactsQuery.data ?? []).map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}
                      {c.company ? ` · ${c.company}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="deal">Deal</Label>
              <Select value={dealId} onValueChange={setDealId}>
                <SelectTrigger id="deal">
                  <SelectValue placeholder="Select a deal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>None</SelectItem>
                  {(dealsQuery.data ?? []).map((d) => (
                    <SelectItem key={d.id} value={String(d.id)}>
                      {d.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What happened? Any next steps?"
              rows={4}
            />
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving..." : isEdit ? "Save changes" : "Log activity"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
