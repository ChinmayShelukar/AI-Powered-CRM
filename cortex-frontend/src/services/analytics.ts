import { api } from "./api";
import type { RfmRow, RiskRow, DealHealthRow, TeamInsightResponse, BriefingResponse } from "@/types/api";

export const analyticsApi = {
  rfm: () => api.get<RfmRow[]>("/api/analytics/rfm").then((r) => r.data),
  risk: () => api.get<RiskRow[]>("/api/analytics/risk").then((r) => r.data),
  dealHealth: () => api.get<DealHealthRow[]>("/api/analytics/deal-health").then((r) => r.data),
  teamInsights: () => api.get<TeamInsightResponse>("/api/analytics/team-insights").then((r) => r.data),
  briefing: () => api.get<BriefingResponse>("/api/analytics/briefing").then((r) => r.data),
};
