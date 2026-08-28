import { create } from "zustand";
import type { NotificationPayload } from "@/types/api";

const MAX_NOTIFICATIONS = 30;

export interface AppNotification {
  id: string;
  receivedAt: string;
  read: boolean;
  payload: NotificationPayload;
}

interface NotificationState {
  items: AppNotification[];
  add: (n: NotificationPayload) => AppNotification;
  markAllRead: () => void;
  clear: () => void;
  unreadCount: () => number;
}

let counter = 0;

export const useNotificationStore = create<NotificationState>()((set, get) => ({
  items: [],
  add: (payload) => {
    const n: AppNotification = {
      id: `${Date.now()}-${counter++}`,
      receivedAt: new Date().toISOString(),
      read: false,
      payload,
    };
    set((s) => ({ items: [n, ...s.items].slice(0, MAX_NOTIFICATIONS) }));
    return n;
  },
  markAllRead: () =>
    set((s) => ({ items: s.items.map((i) => (i.read ? i : { ...i, read: true })) })),
  clear: () => set({ items: [] }),
  unreadCount: () => get().items.filter((i) => !i.read).length,
}));
