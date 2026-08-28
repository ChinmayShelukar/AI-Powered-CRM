import { api } from "./api";
import type { Deal, DealRequest, DealStage } from "@/types/api";

export const dealsApi = {
  list: () => api.get<Deal[]>("/api/deals").then((r) => r.data),
  get: (id: number) => api.get<Deal>(`/api/deals/${id}`).then((r) => r.data),
  create: (req: DealRequest) => api.post<Deal>("/api/deals", req).then((r) => r.data),
  update: (id: number, req: DealRequest) =>
    api.put<Deal>(`/api/deals/${id}`, req).then((r) => r.data),
  updateStage: (id: number, stage: DealStage) =>
    api.put<Deal>(`/api/deals/${id}/stage`, { stage }).then((r) => r.data),
  remove: (id: number) => api.delete(`/api/deals/${id}`).then(() => undefined),
};
