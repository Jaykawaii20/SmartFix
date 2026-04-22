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
    register: (data: { fullName: string; email: string; password: string; department: string }) =>
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
  maintenance: {
    getStaffLists: () => request<MaintenanceStaffData>("/api/maintenance/staff-lists"),
    updateStaffLists: (data: MaintenanceStaffData) =>
      request<void>("/api/maintenance/staff-lists", { method: "PUT", body: JSON.stringify(data) }),
    getRoutingRules: () => request<RoutingRule[]>("/api/maintenance/routing"),
    createRoutingRule: (data: Omit<RoutingRule, "id" | "assigneeName">) =>
      request<RoutingRule>("/api/maintenance/routing", { method: "POST", body: JSON.stringify(data) }),
    deleteRoutingRule: (id: number) =>
      request<void>(`/api/maintenance/routing/${id}`, { method: "DELETE" }),
    getTicketOptions: () => request<TicketInfoOptions>("/api/maintenance/ticket-options"),
    updateTicketOptions: (data: TicketInfoOptions) =>
      request<void>("/api/maintenance/ticket-options", { method: "PUT", body: JSON.stringify(data) }),
    getEvalForm: () => request<EvalForm>("/api/maintenance/eval-form"),
    updateEvalForm: (data: EvalForm) =>
      request<void>("/api/maintenance/eval-form", { method: "PUT", body: JSON.stringify(data) }),
  },
  approvals: {
    list: () => request<{ tickets: Ticket[]; count: number }>("/api/approvals"),
    transferL2: (id: number) =>
      request<void>(`/api/approvals/${id}/transfer`, { method: "POST" }),
    resolve: (id: number, data: ResolveTicketRequest) =>
      request<void>(`/api/approvals/${id}/resolve`, { method: "POST", body: JSON.stringify(data) }),
    cancel: (id: number) =>
      request<void>(`/api/approvals/${id}/cancel`, { method: "POST" }),
  },
  roles: {
    list: () => request<Role[]>("/api/roles"),
    get: (id: number) => request<Role>(`/api/roles/${id}`),
    create: (data: { name: string; description: string; permissions: RolePermission[] }) =>
      request<Role>("/api/roles", { method: "POST", body: JSON.stringify(data) }),
    update: (id: number, data: { name: string; description: string; permissions: RolePermission[] }) =>
      request<Role>(`/api/roles/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: number) => request<void>(`/api/roles/${id}`, { method: "DELETE" }),
  },
  users: {
    list: () => request<UserRecord[]>("/api/users"),
    myPermissions: () => request<RolePermission[]>("/api/users/me/permissions"),
    updateRole: (id: number, roleId: number) =>
      request<UserRecord>(`/api/users/${id}/role`, { method: "PATCH", body: JSON.stringify({ roleId }) }),
    toggleActive: (id: number) =>
      request<UserRecord>(`/api/users/${id}/toggle-active`, { method: "PATCH" }),
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
  roleId?: number;
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

export interface MaintenanceStaffData {
  l1: string[];
  l2: string[];
  l3: string[];
  l4: string[];
  departments: string[];
  businessUnits: string[];
}

export interface TicketInfoOptions {
  priorities: string[];
  supportCategories: string[];
  problemCategories: string[];
  subCategories: string[];
  severities: string[];
  personnelLevels: string[];
}

export interface EvalFormQuestion {
  id: number;
  text: string;
  type: string;
}

export interface EvalForm {
  title: string;
  introMessage: string;
  questions: EvalFormQuestion[];
}

export interface RoutingRule {
  id: number;
  name: string;
  description?: string;
  formType?: string;
  department?: string;
  assignedLevel: string;
  assigneeId?: number;
  assigneeName?: string;
}

export interface ResolveTicketRequest {
  priority: string;
  supportCategory: string;
  problemCategory: string;
  subCategory: string;
  severity: string;
  personnelLevel: string;
  troubleshootingDescription: string;
}

export const MODULES = [
  "dashboard",
  "service_tracker",
  "approvals",
  "maintenance",
  "reports",
  "status",
  "users",
  "roles",
] as const;

export type ModuleName = (typeof MODULES)[number];

export interface RolePermission {
  module: string;
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

export interface Role {
  id: number;
  name: string;
  description: string;
  isDefault: boolean;
  isSystem: boolean;
  permissions: RolePermission[];
}

export interface UserRecord {
  id: number;
  fullName: string;
  email: string;
  department: string;
  level: string;
  roleId?: number;
  roleName?: string;
  isActive: boolean;
  createdAt: string;
}
