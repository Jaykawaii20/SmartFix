const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://localhost:44301";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("smartfix_token");
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Request failed" }));
    throw new Error(err.message || "Request failed");
  }

  return res.json();
}

export const api = {
  auth: {
    login: (data: { email: string; password: string }) =>
      request<AuthResponse>("/api/auth/login", { method: "POST", body: JSON.stringify(data) }),
    register: (data: { fullName: string; email: string; password: string; department: string; role?: string }) =>
      request<AuthResponse>("/api/auth/register", { method: "POST", body: JSON.stringify(data) }),
  },
  tickets: {
    list: (params?: { status?: string; search?: string }) => {
      const qs = new URLSearchParams();
      if (params?.status) qs.set("status", params.status);
      if (params?.search) qs.set("search", params.search);
      return request<TicketListResponse>(`/api/tickets?${qs}`);
    },
    get: (id: number) => request<Ticket>(`/api/tickets/${id}`),
    create: (data: CreateTicketRequest) =>
      request<Ticket>("/api/tickets", { method: "POST", body: JSON.stringify(data) }),
    updateStatus: (id: number, data: { status: string; assignedToId?: string }) =>
      request<Ticket>(`/api/tickets/${id}/status`, { method: "PATCH", body: JSON.stringify(data) }),
  },
  dashboard: {
    get: () => request<DashboardData>("/api/dashboard"),
    status: () => request<StatusData>("/api/dashboard/status"),
    reports: () => request<ReportsData>("/api/dashboard/reports"),
  },
  notifications: {
    list: () => request<{ notifications: Notification[]; unreadCount: number }>("/api/notifications"),
    markRead: (id: number) => request<void>(`/api/notifications/${id}/read`, { method: "PATCH" }),
  },
};

// Types
export interface AuthResponse {
  token: string;
  fullName: string;
  email: string;
  role: string;
  department: string;
  level: string;
  userId: number;
}

export interface ApprovalStep {
  level: number;
  assigneeName: string;
  status: string;
  note?: string;
}

export interface Ticket {
  id: number;
  ticketNumber: string;
  scaNumber?: string;
  requesterEmail: string;
  requesterName: string;
  department: string;
  businessUnit?: string;
  formType: string;
  application: string;
  priority: string;
  category: string;
  description: string;
  status: string;
  slaStatus: string;
  slaHours: number;
  level: string;
  assignedToName?: string;
  createdAt: string;
  slaDeadline: string;
  approvalChain?: ApprovalStep[];
}

export interface TicketListResponse {
  tickets: Ticket[];
  totalCount: number;
  pendingCount: number;
  transferredCount: number;
  resolvedCount: number;
  disapprovedCount: number;
  cancelledCount: number;
}

export interface CreateTicketRequest {
  requesterEmail: string;
  department: string;
  formType: string;
  application: string;
  priority: string;
  category: string;
  description: string;
}

export interface DashboardData {
  ticketDistribution: { transferred: number; pending: number; resolved: number; disapproved: number; cancelled: number; total: number };
  staffWorkload: { name: string; level: string; department: string; activeCount: number; totalCount: number }[];
  slaPerformance: { onTimeResolved: number; criticalOverdue: number; activeDelayed: number; syncHealthy: boolean };
  kpis: { mttrHours: number; fcrRate: number; slaCompliance: number; csatScore: number };
}

export interface StatusData {
  onTimeCount: number;
  delayedCount: number;
  overdueCount: number;
  onTimeTickets: Ticket[];
  delayedTickets: Ticket[];
  overdueTickets: Ticket[];
}

export interface ReportsData {
  ticketDistribution: { transferred: number; pending: number; resolved: number; disapproved: number; cancelled: number; total: number };
  slaStatuses: { ticketNumber: string; priority: string; slaHours: number; slaStatus: string; requesterName: string }[];
  kpis: { mttrHours: number; fcrRate: number; slaCompliance: number; csatScore: number };
}

export interface Notification {
  id: number;
  message: string;
  isRead: boolean;
  createdAt: string;
  ticketNumber?: string;
}
