const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

export class ApiError extends Error {
  statusCode?: number;
  details?: any;
  constructor(message: string, statusCode?: number, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('razorrecover_token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiError(data.error || `HTTP error ${response.status}`, response.status, data.details);
  }

  return data;
}

export const api = {
  // Auth
  login: (credentials: { email: string; password: string }) => 
    request<{ success: boolean; token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),

  signup: (payload: { email: string; password: string; fullName: string; role: 'ADMIN' | 'CUSTOMER'; company?: string }) =>
    request<{ success: boolean; token: string; user: any }>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  googleLogin: (payload: { email: string; fullName?: string; avatarUrl?: string; googleId?: string; role?: 'ADMIN' | 'CUSTOMER'; company?: string }) =>
    request<{ success: boolean; token: string; user: any }>('/auth/google', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getMe: () => request<{ success: boolean; user: any }>('/auth/me'),

  // Metrics
  getMetricsSummary: () => request<{ success: boolean; data: any }>('/metrics/summary'),
  getMetricsTrends: () => request<{ success: boolean; data: any }>('/metrics/trends'),

  // Cases
  getCases: (params?: { issueType?: string; riskLevel?: string; status?: string; search?: string; sortBy?: string }) => {
    const query = new URLSearchParams();
    if (params?.issueType) query.set('issueType', params.issueType);
    if (params?.riskLevel) query.set('riskLevel', params.riskLevel);
    if (params?.status) query.set('status', params.status);
    if (params?.search) query.set('search', params.search);
    if (params?.sortBy) query.set('sortBy', params.sortBy);
    const qs = query.toString();
    return request<{ success: boolean; count: number; data: any[] }>(`/cases${qs ? `?${qs}` : ''}`);
  },

  getCaseById: (id: string) => request<{ success: boolean; data: any }>(`/cases/${id}`),

  getCaseTimeline: (id: string) => request<{ success: boolean; caseId: string; data: any[] }>(`/cases/${id}/timeline`),

  approveCase: (id: string, notes?: string) =>
    request<{ success: boolean; message: string; data: any }>(`/cases/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    }),

  rejectCase: (id: string, reason: string, notes?: string) =>
    request<{ success: boolean; message: string; data: any }>(`/cases/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason, notes }),
    }),

  stopCase: (id: string, reason: string, notes?: string) =>
    request<{ success: boolean; message: string; data: any }>(`/cases/${id}/stop`, {
      method: 'POST',
      body: JSON.stringify({ reason, notes }),
    }),

  simulateRecovery: (id: string) =>
    request<{ success: boolean; message: string; data: any }>(`/cases/${id}/simulate-recovery`, {
      method: 'POST',
    }),

  runAiDiagnosis: (id: string, force = true) =>
    request<{ success: boolean; message: string; data: any }>(`/cases/${id}/ai-diagnosis`, {
      method: 'POST',
      body: JSON.stringify({ force }),
    }),

  simulateInboundWebhook: () =>
    request<{ success: boolean; message: string; data: any }>('/cases/simulate-inbound-webhook', {
      method: 'POST',
    }),

  resetDemoQueue: () =>
    request<{ success: boolean; message: string; count: number; data: any[] }>('/cases/reset-demo-queue', {
      method: 'POST',
    }),

  escalateCase: (id: string) =>
    request<{ success: boolean; message: string; data: any }>(`/cases/${id}/escalate`, {
      method: 'POST',
    }),

  recoverCase: (id: string) =>
    request<{ success: boolean; message: string; data: any }>(`/cases/${id}/recover`, {
      method: 'POST',
    }),

  reopenCase: (id: string) =>
    request<{ success: boolean; message: string; data: any }>(`/cases/${id}/reopen`, {
      method: 'POST',
    }),

  // Recovery Actions (Phase 5)
  getCaseActions: (caseId: string) =>
    request<{ success: boolean; data: any[] }>(`/cases/${caseId}/actions`),

  planRecoveryAction: (caseId: string, data: any) =>
    request<{ success: boolean; message: string; data: any }>(`/cases/${caseId}/actions/plan`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  approveRecoveryAction: (caseId: string, actionId: string, notes?: string) =>
    request<{ success: boolean; message: string; data: any }>(`/cases/${caseId}/actions/${actionId}/approve`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    }),

  executeRecoveryAction: (caseId: string, actionId: string, notes?: string) =>
    request<{ success: boolean; message: string; data: any }>(`/cases/${caseId}/actions/${actionId}/execute`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    }),

  simulateRecoveryAction: (caseId: string, actionId: string) =>
    request<{ success: boolean; message: string; data: any }>(`/cases/${caseId}/actions/${actionId}/simulate`, {
      method: 'POST',
    }),

  cancelRecoveryAction: (caseId: string, actionId: string, reason: string) =>
    request<{ success: boolean; message: string; data: any }>(`/cases/${caseId}/actions/${actionId}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),

  // Customers
  getCustomers: (params?: Record<string, any>) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') query.append(key, String(val));
      });
    }
    const qs = query.toString();
    return request<{ success: boolean; count: number; data: any[] }>(`/customers${qs ? `?${qs}` : ''}`);
  },
  getMyCustomerProfile: () => request<{ success: boolean; data: any }>('/customers/me'),

  // Payments, Subscriptions, Invoices
  getPayments: (params?: Record<string, any>) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') query.append(key, String(val));
      });
    }
    const qs = query.toString();
    return request<{ success: boolean; count: number; data: any[] }>(`/payments${qs ? `?${qs}` : ''}`);
  },
  getSubscriptions: (params?: Record<string, any>) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') query.append(key, String(val));
      });
    }
    const qs = query.toString();
    return request<{ success: boolean; count: number; data: any[] }>(`/subscriptions${qs ? `?${qs}` : ''}`);
  },
  getInvoices: (params?: Record<string, any>) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') query.append(key, String(val));
      });
    }
    const qs = query.toString();
    return request<{ success: boolean; count: number; data: any[] }>(`/invoices${qs ? `?${qs}` : ''}`);
  },

  // Policies
  getPolicies: () => request<{ success: boolean; count: number; data: any[] }>('/policies'),
  createPolicy: (policy: any) =>
    request<{ success: boolean; data: any }>('/policies', {
      method: 'POST',
      body: JSON.stringify(policy),
    }),
  togglePolicy: (id: string, is_active: boolean) =>
    request<{ success: boolean; data: any }>(`/policies/${id}/toggle`, {
      method: 'PATCH',
      body: JSON.stringify({ is_active }),
    }),

  // Copilot Agent
  askCopilot: (message: string) =>
    request<{ success: boolean; data: any }>('/copilot/messages', {
      method: 'POST',
      body: JSON.stringify({ message }),
    }),

  // Simulations
  getSimulations: () => request<{ success: boolean; data: any[] }>('/simulation/runs'),
  getSimulationRuns: () => request<{ success: boolean; data: any[] }>('/simulation/runs'),
  runSimulation: (payload: any) =>
    request<{ success: boolean; data: any }>('/simulation/runs', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Analytics & Health (Phase 6)
  getAnalytics: (filters?: { startDate?: string; endDate?: string; status?: string; paymentMethod?: string; currency?: string }) => {
    const params = new URLSearchParams();
    if (filters?.startDate) params.set('startDate', filters.startDate);
    if (filters?.endDate) params.set('endDate', filters.endDate);
    if (filters?.status) params.set('status', filters.status);
    if (filters?.paymentMethod) params.set('paymentMethod', filters.paymentMethod);
    if (filters?.currency) params.set('currency', filters.currency);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return request<{ success: boolean; data: any }>(`/analytics${qs}`);
  },

  getWebhookHealth: () => request<{ success: boolean; data: any }>('/analytics/webhook-health'),
  getSystemHealth: () => request<{ success: boolean; app: string; executionMode: string; systems: any }>('/health'),

  exportCsv: async (type: 'cases' | 'payments' | 'analytics' | 'audit-logs') => {
    const token = localStorage.getItem('token');
    const response = await fetch(`http://localhost:5050/api/analytics/export/${type}`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    if (!response.ok) throw new Error('Export failed');
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `razorrecover_${type}_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },

  getAuditLogs: (params?: { action?: string; actor?: string; entity?: string; page?: number; pageSize?: number }) => {
    const qs = new URLSearchParams();
    if (params?.action) qs.set('action', params.action);
    if (params?.actor) qs.set('actor', params.actor);
    if (params?.entity) qs.set('entity', params.entity);
    if (params?.page) qs.set('page', String(params.page));
    if (params?.pageSize) qs.set('pageSize', String(params.pageSize));
    const qStr = qs.toString() ? `?${qs.toString()}` : '';
    return request<{ success: boolean; count?: number; total?: number; page?: number; pageSize?: number; totalPages?: number; data: any[] }>(`/audit-logs${qStr}`);
  },

  getAuditStats: () => request<{ success: boolean; data: any }>('/audit-logs/stats'),

  // Copilot
  getCopilotMessages: () => request<{ success: boolean; data: any[] }>('/copilot/messages'),
  sendCopilotMessage: (message: string) =>
    request<{ success: boolean; data: { userMessage: any; assistantMessage: any } }>('/copilot/messages', {
      method: 'POST',
      body: JSON.stringify({ message }),
    }),

  // Health
  checkHealth: () => request<any>('/health'),

  // Razorpay Real-Time Settlement & Payment Methods
  createPaymentOrder: (payload: { amount: number; invoiceNumber?: string }) =>
    request<{ success: boolean; order: any; keyId: string; amount: number; invoiceNumber: string }>('/payments/create-order', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  verifySettlement: (payload: { paymentId: string; orderId?: string; invoiceNumber?: string; amount?: number; method?: string }) =>
    request<{ success: boolean; message: string; data: any }>('/payments/verify-settlement', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  saveMandate: (payload: { vpa: string; app?: string; limit?: number }) =>
    request<{ success: boolean; message: string; data: any }>('/payments/save-mandate', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  saveCard: (payload: { last4: string; network?: string; name?: string; expiry?: string }) =>
    request<{ success: boolean; message: string; data: any }>('/payments/save-card', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};

