import { api } from "./api";
import type { Contact, ContactRequest } from "@/types/api";

export const contactsApi = {
  list: () => api.get<Contact[]>("/api/contacts").then((r) => r.data),
  get: (id: number) => api.get<Contact>(`/api/contacts/${id}`).then((r) => r.data),
  create: (req: ContactRequest) => api.post<Contact>("/api/contacts", req).then((r) => r.data),
  update: (id: number, req: ContactRequest) =>
    api.put<Contact>(`/api/contacts/${id}`, req).then((r) => r.data),
  remove: (id: number) => api.delete(`/api/contacts/${id}`).then(() => undefined),
};
