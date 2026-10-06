// Centralized API client for CredEx

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'admin' | 'customer';
  customerId?: string;
  isImpersonating?: boolean;
}

export interface Customer {
  _id: string;
  customerCode: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  status: 'active' | 'inactive';
  totalCredit?: number;
  totalDebit?: number;
  totalAdvance?: number;
  balance?: number;
  transactionCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  _id: string;
  productCode: string;
  name: string;
  description?: string;
  category?: string;
  price: number;
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface Transaction {
  _id: string;
  transactionCode: string;
  customerId: Customer | string;
  type: 'CREDIT' | 'DEBIT' | 'ADVANCE';
  isAdvance?: boolean;
  productId?: Product | string;
  productName?: string;
  amount: number;
  description: string;
  referenceNumber?: string;
  transactionDate: string;
  notes?: string;
  createdBy?: { name: string; email: string };
  createdAt: string;
}

export interface NotificationItem {
  _id: string;
  notificationId: string;
  customerId?: Customer | string | null;
  isBroadcast: boolean;
  type: string;
  title: string;
  message: string;
  priority: 'Normal' | 'Medium' | 'High' | 'Urgent';
  isRead: boolean;
  createdAt: string;
}

export interface LedgerEntry {
  _id: string;
  transactionCode: string;
  transactionDate: string;
  type: 'CREDIT' | 'DEBIT';
  productId?: string;
  productName: string;
  description: string;
  referenceNumber: string;
  notes: string;
  amount: number;
  creditAmount: number | null;
  debitAmount: number | null;
  runningBalance: number;
}

export interface AuditLogItem {
  _id: string;
  userId?: string;
  userName: string;
  userRole: string;
  action: string;
  description: string;
  targetId?: string;
  ipAddress?: string;
  createdAt: string;
}

// Token storage helpers
const TOKEN_KEY = 'credex_auth_token';
const ADMIN_BACKUP_TOKEN_KEY = 'credex_admin_backup_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ADMIN_BACKUP_TOKEN_KEY);
}

export function saveAdminBackupToken(token: string): void {
  localStorage.setItem(ADMIN_BACKUP_TOKEN_KEY, token);
}

export function getAdminBackupToken(): string | null {
  return localStorage.getItem(ADMIN_BACKUP_TOKEN_KEY);
}

export function restoreAdminToken(): boolean {
  const adminToken = getAdminBackupToken();
  if (adminToken) {
    localStorage.setItem(TOKEN_KEY, adminToken);
    localStorage.removeItem(ADMIN_BACKUP_TOKEN_KEY);
    return true;
  }
  return false;
}

// Base URL for API requests (supports separate backend host if VITE_API_BASE_URL is set in Vercel)
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    (headers as any)['Authorization'] = `Bearer ${token}`;
  }

  const targetUrl = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  try {
    const response = await fetch(targetUrl, {
      ...options,
      headers,
      signal: options.signal || controller.signal,
    });

    const contentType = response.headers.get('content-type') || '';
    let data: any;

    if (contentType.includes('application/json')) {
      data = await response.json();
    } else {
      // Non-JSON response (e.g. Vercel 404 HTML, 502 Bad Gateway, or Cloudflare error)
      const rawText = await response.text();
      const isHtml = rawText.trim().startsWith('<') || rawText.includes('The page c') || rawText.includes('404');
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(
            'API Route Not Found (404). If deployed on Vercel, please ensure vercel.json is deployed and your serverless function is configured.'
          );
        }
        throw new Error(
          isHtml
            ? `Server error (${response.status}). Please check Vercel deployment logs.`
            : rawText || `Request failed with status ${response.status}`
        );
      }
      
      // If OK but not JSON
      try {
        data = JSON.parse(rawText);
      } catch {
        throw new Error(`Unexpected non-JSON response from server (${response.status}).`);
      }
    }

    if (!response.ok || data.success === false) {
      throw new Error(data.message || `Request failed with status ${response.status}`);
    }

    return data;
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw new Error('Request timed out. Please check your internet connection or backend server.');
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

export const api = {
  auth: {
    login: (identifier: string, password: string) =>
      request<{ success: boolean; data: { token: string; user: User; customer: Customer | null } }>(
        '/api/auth/login',
        {
          method: 'POST',
          body: JSON.stringify({ identifier, email: identifier, phone: identifier, password }),
        }
      ),

    register: (payload: { name: string; email: string; password: string; phone?: string; role?: string }) =>
      request<{ success: boolean; data: { token: string; user: User; customer: Customer | null } }>(
        '/api/auth/register',
        {
          method: 'POST',
          body: JSON.stringify(payload),
        }
      ),

    getMe: () =>
      request<{ success: boolean; data: { user: User; customer: Customer | null } }>('/api/auth/me'),

    impersonate: (customerId: string) =>
      request<{ success: boolean; data: { token: string; customer: Customer; isImpersonating: boolean } }>(
        `/api/auth/impersonate/${customerId}`,
        { method: 'POST' }
      ),

    changePassword: (currentPassword: string, newPassword: string) =>
      request<{ success: boolean; message: string }>('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      }),

    logout: () =>
      request<{ success: boolean }>('/api/auth/logout', { method: 'POST' }).catch(() => {}),
  },

  customers: {
    getAll: (params: { search?: string; status?: string; page?: number; limit?: number } = {}) => {
      const qs = new URLSearchParams();
      if (params.search) qs.append('search', params.search);
      if (params.status) qs.append('status', params.status);
      if (params.page) qs.append('page', params.page.toString());
      if (params.limit) qs.append('limit', params.limit.toString());
      return request<{
        success: boolean;
        data: {
          customers: Customer[];
          pagination: { total: number; page: number; limit: number; pages: number };
        };
      }>(`/api/customers?${qs.toString()}`);
    },

    getById: (id: string) =>
      request<{
        success: boolean;
        data: {
          customer: Customer;
          financialSummary: { totalCredit: number; totalDebit: number; balance: number; transactionCount: number };
          recentTransactions: Transaction[];
          productsBought: string[];
          notifications: NotificationItem[];
        };
      }>(`/api/customers/${id}`),

    create: (data: Partial<Customer> & { password?: string }) =>
      request<{ success: boolean; message: string; data: { customer: Customer; defaultPassword?: string } }>(
        '/api/customers',
        {
          method: 'POST',
          body: JSON.stringify(data),
        }
      ),

    update: (id: string, data: Partial<Customer>) =>
      request<{ success: boolean; message: string; data: Customer }>(`/api/customers/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    delete: (id: string) =>
      request<{ success: boolean; message: string }>(`/api/customers/${id}`, {
        method: 'DELETE',
      }),

    getLedger: (id: string) =>
      request<{
        success: boolean;
        data: {
          customer: Customer;
          summary: { totalCredit: number; totalDebit: number; balance: number; transactionCount: number };
          entries: LedgerEntry[];
        };
      }>(`/api/customers/${id}/ledger`),

    getBalance: (id: string) =>
      request<{
        success: boolean;
        data: { totalCredit: number; totalDebit: number; balance: number; transactionCount: number };
      }>(`/api/customers/${id}/balance`),
  },

  products: {
    getAll: (params: { search?: string; category?: string; status?: string; limit?: number; page?: number } = {}) => {
      const qs = new URLSearchParams();
      if (params.search) qs.append('search', params.search);
      if (params.category) qs.append('category', params.category);
      if (params.status) qs.append('status', params.status);
      if (params.limit) qs.append('limit', params.limit.toString());
      if (params.page) qs.append('page', params.page.toString());
      return request<{
        success: boolean;
        data: {
          products: Product[];
          categories: string[];
          pagination: { total: number; page: number; limit: number };
        };
      }>(`/api/products?${qs.toString()}`);
    },

    create: (data: Partial<Product>) =>
      request<{ success: boolean; message: string; data: Product }>('/api/products', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    update: (id: string, data: Partial<Product>) =>
      request<{ success: boolean; message: string; data: Product }>(`/api/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    delete: (id: string) =>
      request<{ success: boolean; message: string }>(`/api/products/${id}`, {
        method: 'DELETE',
      }),
  },

  transactions: {
    getAll: (params: Record<string, any> = {}) => {
      const qs = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') qs.append(k, v.toString());
      });
      return request<{
        success: boolean;
        data: {
          transactions: Transaction[];
          pagination: { total: number; page: number; limit: number; pages: number };
        };
      }>(`/api/transactions?${qs.toString()}`);
    },

    getById: (id: string) =>
      request<{ success: boolean; data: Transaction }>(`/api/transactions/${id}`),

    create: (data: {
      customerId: string;
      type: 'CREDIT' | 'DEBIT' | 'ADVANCE';
      isAdvance?: boolean;
      productId?: string;
      productName?: string;
      amount: number;
      description: string;
      referenceNumber?: string;
      transactionDate?: string;
      notes?: string;
    }) =>
      request<{ success: boolean; message: string; data: Transaction }>('/api/transactions', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    update: (id: string, data: Partial<Transaction>) =>
      request<{ success: boolean; message: string; data: Transaction }>(`/api/transactions/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    delete: (id: string) =>
      request<{ success: boolean; message: string }>(`/api/transactions/${id}`, {
        method: 'DELETE',
      }),
  },

  notifications: {
    getAll: () =>
      request<{ success: boolean; data: { notifications: NotificationItem[]; unreadCount: number } }>(
        '/api/notifications'
      ),

    send: (data: {
      target: 'all' | 'single' | 'multiple';
      customerId?: string;
      customerIds?: string[];
      type: string;
      title: string;
      message: string;
      priority: string;
    }) =>
      request<{ success: boolean; message: string }>('/api/notifications', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    markAsRead: (id: string) =>
      request<{ success: boolean }>(`/api/notifications/${id}/read`, { method: 'PUT' }),

    markAllAsRead: () =>
      request<{ success: boolean }>('/api/notifications/read-all', { method: 'PUT' }),

    delete: (id: string) =>
      request<{ success: boolean }>(`/api/notifications/${id}`, { method: 'DELETE' }),
  },

  reports: {
    getDashboardStats: () =>
      request<{
        success: boolean;
        data: {
          metrics: {
            totalCustomers: number;
            totalCredit: number;
            totalDebit: number;
            totalOutstanding: number;
            totalTransactions: number;
            totalProducts: number;
            todayCredit: number;
            todayDebit: number;
          };
          monthlyTrends: { month: string; credit: number; debit: number }[];
          topOutstandingCustomers: {
            id: string;
            name: string;
            customerCode: string;
            phone: string;
            balance: number;
            totalCredit: number;
            totalDebit: number;
          }[];
          recentTransactions: any[];
        };
      }>('/api/reports/dashboard-stats'),

    getCustomersReport: (params: { search?: string; balanceStatus?: string } = {}) => {
      const qs = new URLSearchParams();
      if (params.search) qs.append('search', params.search);
      if (params.balanceStatus) qs.append('balanceStatus', params.balanceStatus);
      return request<{ success: boolean; data: any[] }>(`/api/reports/customers?${qs.toString()}`);
    },

    getTransactionsReport: (params: Record<string, any> = {}) => {
      const qs = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (v) qs.append(k, v.toString());
      });
      return request<{ success: boolean; data: any[] }>(`/api/reports/transactions?${qs.toString()}`);
    },

    getProductsReport: () =>
      request<{ success: boolean; data: any[] }>('/api/reports/products'),
  },

  auditLogs: {
    getAll: (params: { search?: string; action?: string; page?: number; limit?: number } = {}) => {
      const qs = new URLSearchParams();
      if (params.search) qs.append('search', params.search);
      if (params.action) qs.append('action', params.action);
      if (params.page) qs.append('page', params.page.toString());
      if (params.limit) qs.append('limit', params.limit.toString());
      return request<{
        success: boolean;
        data: {
          logs: AuditLogItem[];
          actions: string[];
          pagination: { total: number; page: number; limit: number; pages: number };
        };
      }>(`/api/audit-logs?${qs.toString()}`);
    },
  },
};
