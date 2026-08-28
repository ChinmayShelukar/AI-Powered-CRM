import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuthStore } from "@/store/auth";
import { useNotificationStore } from "@/store/notifications";
import { API_BASE_URL } from "@/services/api";
import type { NotificationEventType, NotificationPayload } from "@/types/api";

const EVENT_TYPES: NotificationEventType[] = [
  "deal.stage.changed",
  "activity.logged",
  "contact.assigned",
];

function buildToastMessage(payload: NotificationPayload): { title: string; description?: string } {
  switch (payload.type) {
    case "deal.stage.changed":
      return {
        title: `${payload.data.dealTitle} → ${payload.data.toStage}`,
        description: "Deal stage updated",
      };
    case "activity.logged":
      return {
        title: `New ${payload.data.type.toLowerCase()} logged`,
        description: "On a record assigned to you",
      };
    case "contact.assigned":
      return {
        title: `${payload.data.contactName} assigned to you`,
      };
  }
}

function invalidateRelatedQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  payload: NotificationPayload
) {
  switch (payload.type) {
    case "deal.stage.changed":
      queryClient.invalidateQueries({ queryKey: ["deals"] });
      break;
    case "activity.logged":
      queryClient.invalidateQueries({ queryKey: ["activities"] });
      break;
    case "contact.assigned":
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      break;
  }
}

/**
 * Mounts a single EventSource connection for the authenticated user. Streams
 * notifications into the Zustand notification store, fires sonner toasts, and
 * invalidates related TanStack queries so views stay live.
 *
 * Browsers do not allow custom headers on EventSource, so the JWT is passed as
 * a `?token=` query param — the backend's JwtFilter accepts this only for the
 * /api/notifications/stream path.
 */
export function useNotificationStream(): void {
  const token = useAuthStore((s) => s.token);
  const add = useNotificationStore((s) => s.add);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!token) return;

    const url = `${API_BASE_URL}/api/notifications/stream?token=${encodeURIComponent(token)}`;
    const es = new EventSource(url);

    const handlers: Array<(e: MessageEvent) => void> = [];

    EVENT_TYPES.forEach((type) => {
      const handler = (e: MessageEvent) => {
        let data: unknown;
        try {
          data = JSON.parse(e.data);
        } catch {
          return;
        }
        const payload = { type, data } as NotificationPayload;
        add(payload);
        const t = buildToastMessage(payload);
        toast.info(t.title, t.description ? { description: t.description } : undefined);
        invalidateRelatedQueries(queryClient, payload);
      };
      es.addEventListener(type, handler as EventListener);
      handlers.push(handler);
    });

    es.onerror = () => {
      // EventSource auto-reconnects with backoff. Silent here so we don't toast on
      // every transient blip; bell badge will simply pause until reconnect.
    };

    // Close before the browser suspends the in-flight request on reload/close,
    // which otherwise logs net::ERR_NETWORK_IO_SUSPENDED. Client-side nav uses
    // the unmount cleanup below instead.
    const closeOnHide = () => es.close();
    window.addEventListener("pagehide", closeOnHide);

    return () => {
      window.removeEventListener("pagehide", closeOnHide);
      EVENT_TYPES.forEach((type, i) => {
        es.removeEventListener(type, handlers[i] as EventListener);
      });
      es.close();
    };
  }, [token, add, queryClient]);
}
