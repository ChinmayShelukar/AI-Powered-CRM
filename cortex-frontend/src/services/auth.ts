import { api } from "./api";
import type { AuthResponse, LoginRequest, RegisterRequest } from "@/types/api";

export const authApi = {
  login: (req: LoginRequest) =>
    api.post<AuthResponse>("/api/auth/login", req).then((r) => r.data),

  register: (req: RegisterRequest) =>
    api.post<AuthResponse>("/api/auth/register", req).then((r) => r.data),
};
