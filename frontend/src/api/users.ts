import { apiRequest } from "./client";
import type { User, UserRole } from "@/types";

export const usersApi = {
  list: (role?: UserRole) =>
    apiRequest<User[]>(`/users${role ? `?role=${role}` : ""}`),

  get: (userId: string) => apiRequest<User>(`/users/${userId}`),

  updateRole: (userId: string, role: UserRole) =>
    apiRequest<User>(`/users/${userId}/role`, { method: "PATCH", body: { role } }),

  deactivate: (userId: string) =>
    apiRequest<void>(`/users/${userId}`, { method: "DELETE" }),
};
