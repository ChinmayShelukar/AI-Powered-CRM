import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { activitiesApi } from "@/services/activities";
import { extractErrorMessage } from "@/services/api";
import { ACTIVITY_META } from "./activityMeta";
import type { Activity } from "@/types/api";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  activity: Activity | null;
}

export function DeleteActivityDialog({ open, onOpenChange, activity }: Props) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => activitiesApi.remove(activity!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activities"] });
      toast.success("Activity deleted");
      onOpenChange(false);
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });

  const label = activity ? ACTIVITY_META[activity.type].label.toLowerCase() : "activity";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete activity?</DialogTitle>
          <DialogDescription>
            This will permanently delete the {label} logged by{" "}
            <span className="font-medium text-foreground">{activity?.createdByUserName}</span>.
            This breaks the audit trail for this interaction and can&apos;t be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
