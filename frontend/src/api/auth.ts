import { apiRequest } from "./client";
import type { LoginPayload, RegisterPayload, TokenResponse, User } from "@/types";

export const authApi = {
  login: (payload: LoginPayload) =>
    apiRequest<TokenResponse>("/auth/login", { method: "POST", body: payload, auth: false }),

  register: (payload: RegisterPayload) =>
    apiRequest<User>("/auth/register", { method: "POST", body: payload, auth: false }),

  me: () => apiRequest<User>("/auth/me"),

  logout: (refreshToken: string) =>
    apiRequest<void>("/auth/logout", { method: "POST", body: { refresh_token: refreshToken }, auth: false }),

  forgotPassword: (email: string) =>
    apiRequest<{ message: string }>("/auth/forgot-password", {
      method: "POST",
      body: { email },
      auth: false,
    }),

  resetPassword: (token: string, new_password: string) =>
    apiRequest<{ message: string }>("/auth/reset-password", {
      method: "POST",
      body: { token, new_password },
      auth: false,
    }),
};
