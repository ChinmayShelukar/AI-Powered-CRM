import { api } from "./api";
import type { AiQueryResponse, AiTextResponse } from "@/types/api";

export const aiApi = {
  query: (question: string) =>
    api.post<AiQueryResponse>("/api/ai/query", { question }).then((r) => r.data),
  summarize: (contactId: number) =>
    api.post<AiTextResponse>(`/api/ai/summarize/${contactId}`).then((r) => r.data),
  draftEmail: (contactId: number) =>
    api.post<AiTextResponse>(`/api/ai/draft-email/${contactId}`).then((r) => r.data),
};
