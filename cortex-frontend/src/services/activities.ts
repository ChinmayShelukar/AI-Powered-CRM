import { api } from "./api";
import type { Activity, ActivityRequest } from "@/types/api";

export const activitiesApi = {
  list: (params?: { contactId?: number; dealId?: number }) =>
    api.get<Activity[]>("/api/activities", { params }).then((r) => r.data),
  create: (req: ActivityRequest) =>
    api.post<Activity>("/api/activities", req).then((r) => r.data),
  update: (id: number, req: ActivityRequest) =>
    api.put<Activity>(`/api/activities/${id}`, req).then((r) => r.data),
  remove: (id: number) => api.delete(`/api/activities/${id}`).then(() => undefined),
};
