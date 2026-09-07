import { apiRequest } from "./client";
import type {
  Ticket,
  TicketEvent,
  TicketCreatePayload,
  TicketUpdatePayload,
  TicketStatus,
} from "@/types";

export interface TicketListFilters {
  status_filter?: TicketStatus;
  priority?: string;
  assigned_technician_id?: string;
  skip?: number;
  limit?: number;
}

function toQueryString(filters: TicketListFilters = {}): string {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== "") params.set(key, String(value));
  });
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export const ticketsApi = {
  list: (filters?: TicketListFilters) =>
    apiRequest<Ticket[]>(`/tickets${toQueryString(filters)}`),

  get: (ticketId: string) => apiRequest<Ticket>(`/tickets/${ticketId}`),

  getEvents: (ticketId: string) => apiRequest<TicketEvent[]>(`/tickets/${ticketId}/events`),

  create: (payload: TicketCreatePayload) =>
    apiRequest<Ticket>("/tickets", { method: "POST", body: payload }),

  update: (ticketId: string, payload: TicketUpdatePayload) =>
    apiRequest<Ticket>(`/tickets/${ticketId}`, { method: "PATCH", body: payload }),

  addNote: (ticketId: string, note: string) =>
    apiRequest<TicketEvent>(`/tickets/${ticketId}/notes?note=${encodeURIComponent(note)}`, {
      method: "POST",
    }),

  remove: (ticketId: string) =>
    apiRequest<void>(`/tickets/${ticketId}`, { method: "DELETE" }),
};
