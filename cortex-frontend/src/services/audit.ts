import { api } from "./api";
import type { AuditLog, PagedResponse } from "@/types/api";

export const auditApi = {
  list: (params?: { entityType?: string; entityId?: number; page?: number; size?: number }) =>
    api.get<PagedResponse<AuditLog>>("/api/audit", { params }).then((r) => r.data),

  listForEntity: (entityType: string, entityId: number) =>
    api.get<AuditLog[]>("/api/audit", { params: { entityType, entityId } }).then((r) => r.data),
};
