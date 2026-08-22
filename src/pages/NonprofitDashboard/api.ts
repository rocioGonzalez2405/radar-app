/**
 * API client for Buy Nothing nonprofit dashboard
 * Handles all communication with the backend API
 */

const BASE_URL = '/api';

// ============================================================================
// TYPES
// ============================================================================

export interface Nonprofit {
  id: string;
  legalName: string;
  operatingName: string;
  primaryServices: string[];
  demographics: string[];
  serviceAreaZipCodes: string[];
  bedCapacity: number;
  ftesCount: number;
  reputationScore: number;
  completedExchanges: number;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryItem {
  id: string;
  nonprofitId: string;
  serviceType: string;
  quantity: number;
  quantityUnit: string;
  description: string;
  demographics: string[];
  availableFrom: string;
  availableUntil: string;
  createdAt: string;
  updatedAt: string;
}

export interface Need {
  id: string;
  nonprofitId: string;
  serviceType: string;
  quantity: number;
  quantityUnit: string;
  description: string;
  demographics: string[];
  urgency: 'critical' | 'high' | 'medium' | 'low';
  deadline: string;
  createdAt: string;
  updatedAt: string;
}

export interface Match {
  id: string;
  inventoryId: string;
  needId: string;
  fromNonprofitId: string;
  toNonprofitId: string;
  status: 'proposed' | 'accepted' | 'rejected' | 'completed';
  fairnessScore: number;
  fairnessBreakdown: {
    fit: number;
    value: number;
    benefit: number;
    radarImpact: number;
    reputation: number;
  };
  reasoning: string;
  isProposable: boolean;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  matchId: string;
  fromNonprofitId: string;
  toNonprofitId: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  startedAt: string;
  completedAt?: string;
  fairnessRating?: number;
  ratingNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface NonprofitsResponse {
  nonprofits: Nonprofit[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

// ============================================================================
// ERROR HANDLING
// ============================================================================

class APIError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'APIError';
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new APIError(response.status, error.error || error.message || response.statusText);
  }
  return response.json();
}

// ============================================================================
// NONPROFIT ENDPOINTS
// ============================================================================

export const nonprofitsApi = {
  register: async (data: Omit<Nonprofit, 'id' | 'reputationScore' | 'completedExchanges' | 'createdAt' | 'updatedAt'>): Promise<Nonprofit> => {
    const response = await fetch(`${BASE_URL}/nonprofits/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<Nonprofit>(response);
  },

  get: async (id: string): Promise<Nonprofit> => {
    const response = await fetch(`${BASE_URL}/nonprofits/${id}`);
    return handleResponse<Nonprofit>(response);
  },

  list: async (filters?: { limit?: number; offset?: number; serviceType?: string; demographic?: string; zip?: string }): Promise<NonprofitsResponse> => {
    const params = new URLSearchParams();
    if (filters?.limit) params.set('limit', filters.limit.toString());
    if (filters?.offset) params.set('offset', filters.offset.toString());
    if (filters?.serviceType) params.set('serviceType', filters.serviceType);
    if (filters?.demographic) params.set('demographic', filters.demographic);
    if (filters?.zip) params.set('zip', filters.zip);

    const response = await fetch(`${BASE_URL}/nonprofits?${params.toString()}`);
    return handleResponse<NonprofitsResponse>(response);
  },

  update: async (id: string, data: Partial<Nonprofit>): Promise<Nonprofit> => {
    const response = await fetch(`${BASE_URL}/nonprofits/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<Nonprofit>(response);
  },
};

// ============================================================================
// INVENTORY ENDPOINTS
// ============================================================================

export const inventoryApi = {
  create: async (nonprofitId: string, data: Omit<InventoryItem, 'id' | 'nonprofitId' | 'createdAt' | 'updatedAt'>): Promise<InventoryItem> => {
    const response = await fetch(`${BASE_URL}/nonprofits/${nonprofitId}/inventory`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<InventoryItem>(response);
  },

  get: async (id: string): Promise<InventoryItem> => {
    const response = await fetch(`${BASE_URL}/inventory/${id}`);
    return handleResponse<InventoryItem>(response);
  },

  listByNonprofit: async (nonprofitId: string, filters?: { limit?: number; offset?: number }): Promise<PaginatedResponse<InventoryItem>> => {
    const params = new URLSearchParams();
    if (filters?.limit) params.set('limit', filters.limit.toString());
    if (filters?.offset) params.set('offset', filters.offset.toString());

    const response = await fetch(`${BASE_URL}/nonprofits/${nonprofitId}/inventory?${params.toString()}`);
    return handleResponse<PaginatedResponse<InventoryItem>>(response);
  },

  search: async (filters?: { serviceType?: string; demographic?: string; zip?: string; limit?: number; offset?: number }): Promise<PaginatedResponse<InventoryItem>> => {
    const params = new URLSearchParams();
    if (filters?.serviceType) params.set('serviceType', filters.serviceType);
    if (filters?.demographic) params.set('demographic', filters.demographic);
    if (filters?.zip) params.set('zip', filters.zip);
    if (filters?.limit) params.set('limit', filters.limit.toString());
    if (filters?.offset) params.set('offset', filters.offset.toString());

    const response = await fetch(`${BASE_URL}/inventory/search?${params.toString()}`);
    return handleResponse<PaginatedResponse<InventoryItem>>(response);
  },

  delete: async (id: string): Promise<void> => {
    const response = await fetch(`${BASE_URL}/inventory/${id}`, { method: 'DELETE' });
    if (!response.ok) throw new APIError(response.status, 'Failed to delete inventory item');
  },
};

// ============================================================================
// NEEDS ENDPOINTS
// ============================================================================

export const needsApi = {
  create: async (nonprofitId: string, data: Omit<Need, 'id' | 'nonprofitId' | 'createdAt' | 'updatedAt'>): Promise<Need> => {
    const response = await fetch(`${BASE_URL}/nonprofits/${nonprofitId}/needs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<Need>(response);
  },

  get: async (id: string): Promise<Need> => {
    const response = await fetch(`${BASE_URL}/needs/${id}`);
    return handleResponse<Need>(response);
  },

  listByNonprofit: async (nonprofitId: string, filters?: { limit?: number; offset?: number }): Promise<PaginatedResponse<Need>> => {
    const params = new URLSearchParams();
    if (filters?.limit) params.set('limit', filters.limit.toString());
    if (filters?.offset) params.set('offset', filters.offset.toString());

    const response = await fetch(`${BASE_URL}/nonprofits/${nonprofitId}/needs?${params.toString()}`);
    return handleResponse<PaginatedResponse<Need>>(response);
  },

  search: async (filters?: { serviceType?: string; demographic?: string; urgency?: string; limit?: number; offset?: number }): Promise<PaginatedResponse<Need>> => {
    const params = new URLSearchParams();
    if (filters?.serviceType) params.set('serviceType', filters.serviceType);
    if (filters?.demographic) params.set('demographic', filters.demographic);
    if (filters?.urgency) params.set('urgency', filters.urgency);
    if (filters?.limit) params.set('limit', filters.limit.toString());
    if (filters?.offset) params.set('offset', filters.offset.toString());

    const response = await fetch(`${BASE_URL}/needs/search?${params.toString()}`);
    return handleResponse<PaginatedResponse<Need>>(response);
  },

  delete: async (id: string): Promise<void> => {
    const response = await fetch(`${BASE_URL}/needs/${id}`, { method: 'DELETE' });
    if (!response.ok) throw new APIError(response.status, 'Failed to delete need');
  },
};

// ============================================================================
// MATCHES ENDPOINTS
// ============================================================================

export const matchesApi = {
  listAll: async (filters?: { limit?: number; offset?: number }): Promise<PaginatedResponse<Match>> => {
    const params = new URLSearchParams();
    if (filters?.limit) params.set('limit', filters.limit.toString());
    if (filters?.offset) params.set('offset', filters.offset.toString());

    const response = await fetch(`${BASE_URL}/matches?${params.toString()}`);
    return handleResponse<PaginatedResponse<Match>>(response);
  },

  get: async (id: string): Promise<Match> => {
    const response = await fetch(`${BASE_URL}/matches/${id}`);
    return handleResponse<Match>(response);
  },

  listByNonprofit: async (nonprofitId: string, filters?: { limit?: number; offset?: number }): Promise<PaginatedResponse<Match>> => {
    const params = new URLSearchParams();
    if (filters?.limit) params.set('limit', filters.limit.toString());
    if (filters?.offset) params.set('offset', filters.offset.toString());

    const response = await fetch(`${BASE_URL}/nonprofits/${nonprofitId}/matches?${params.toString()}`);
    return handleResponse<PaginatedResponse<Match>>(response);
  },

  propose: async (data: { inventoryId: string; needId: string }): Promise<Match> => {
    const response = await fetch(`${BASE_URL}/matches`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<Match>(response);
  },

  accept: async (id: string): Promise<Match> => {
    const response = await fetch(`${BASE_URL}/matches/${id}/accept`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
    });
    return handleResponse<Match>(response);
  },

  reject: async (id: string, reason?: string): Promise<Match> => {
    const response = await fetch(`${BASE_URL}/matches/${id}/reject`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rejectionReason: reason }),
    });
    return handleResponse<Match>(response);
  },
};

// ============================================================================
// TRANSACTIONS ENDPOINTS
// ============================================================================

export const transactionsApi = {
  create: async (matchId: string): Promise<Transaction> => {
    const response = await fetch(`${BASE_URL}/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ matchId }),
    });
    return handleResponse<Transaction>(response);
  },

  get: async (id: string): Promise<Transaction> => {
    const response = await fetch(`${BASE_URL}/transactions/${id}`);
    return handleResponse<Transaction>(response);
  },

  listAll: async (filters?: { limit?: number; offset?: number }): Promise<PaginatedResponse<Transaction>> => {
    const params = new URLSearchParams();
    if (filters?.limit) params.set('limit', filters.limit.toString());
    if (filters?.offset) params.set('offset', filters.offset.toString());

    const response = await fetch(`${BASE_URL}/transactions?${params.toString()}`);
    return handleResponse<PaginatedResponse<Transaction>>(response);
  },

  listByNonprofit: async (nonprofitId: string, filters?: { limit?: number; offset?: number }): Promise<PaginatedResponse<Transaction>> => {
    const params = new URLSearchParams();
    if (filters?.limit) params.set('limit', filters.limit.toString());
    if (filters?.offset) params.set('offset', filters.offset.toString());

    const response = await fetch(`${BASE_URL}/nonprofits/${nonprofitId}/transactions?${params.toString()}`);
    return handleResponse<PaginatedResponse<Transaction>>(response);
  },

  updateStatus: async (id: string, status: string): Promise<Transaction> => {
    const response = await fetch(`${BASE_URL}/transactions/${id}/update`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    return handleResponse<Transaction>(response);
  },

  rateTransaction: async (id: string, rating: number, notes?: string): Promise<Transaction> => {
    const response = await fetch(`${BASE_URL}/transactions/${id}/rate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fairnessRating: rating, ratingNotes: notes }),
    });
    return handleResponse<Transaction>(response);
  },
};

// ============================================================================
// ADMIN ENDPOINTS
// ============================================================================

export const adminApi = {
  getDashboard: async (): Promise<any> => {
    const response = await fetch(`${BASE_URL}/admin/dashboard`);
    return handleResponse<any>(response);
  },

  getPendingMatches: async (filters?: { limit?: number; offset?: number }): Promise<PaginatedResponse<Match>> => {
    const params = new URLSearchParams();
    if (filters?.limit) params.set('limit', filters.limit.toString());
    if (filters?.offset) params.set('offset', filters.offset.toString());

    const response = await fetch(`${BASE_URL}/admin/matches/pending?${params.toString()}`);
    return handleResponse<PaginatedResponse<Match>>(response);
  },

  getRadarImpact: async (): Promise<any> => {
    const response = await fetch(`${BASE_URL}/admin/radar-impact`);
    return handleResponse<any>(response);
  },

  getAuditLog: async (filters?: { limit?: number; offset?: number }): Promise<PaginatedResponse<any>> => {
    const params = new URLSearchParams();
    if (filters?.limit) params.set('limit', filters.limit.toString());
    if (filters?.offset) params.set('offset', filters.offset.toString());

    const response = await fetch(`${BASE_URL}/admin/audit-log?${params.toString()}`);
    return handleResponse<PaginatedResponse<any>>(response);
  },
};
