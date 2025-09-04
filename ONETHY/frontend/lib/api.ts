// API client para backend via proxy Next.js
// Usa /api que é reescrita para http://localhost:4000 no next.config.js
const API_BASE = '/api'

export async function health() {
  const res = await fetch(`${API_BASE}/health`)
  return res.json()
}

export async function login(email: string, password: string) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.message || 'Login inválido')
  return data
}

export async function register(payload: { name: string; email: string; password: string; company?: string }) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.message || 'Registro inválido')
  return data
}

export async function me(token: string) {
  const res = await fetch(`${API_BASE}/me`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  if (!res.ok) throw new Error('Não autenticado')
  return res.json()
}

export async function refresh(refreshToken: string) {
  const res = await fetch(`${API_BASE}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken })
  })
  if (!res.ok) throw new Error('Não foi possível renovar a sessão')
  return res.json()
}

// API Helper function
async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
  
  const config: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
  }

  const response = await fetch(`${API_BASE}${endpoint}`, config)
  const data = await response.json().catch(() => ({}))
  
  if (!response.ok) {
    throw new Error(data.error || data.message || 'Erro na requisição')
  }
  
  return data
}

// CONVERSATIONS API
export const conversationsAPI = {
  list: (params?: {
    status?: string
    assignedTo?: number
    teamId?: number
    channel?: string
    priority?: string
    page?: number
    limit?: number
    search?: string
  }) => {
    const searchParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value))
        }
      })
    }
    const query = searchParams.toString()
    return apiRequest(`/conversations${query ? `?${query}` : ''}`)
  },

  get: (id: number) => apiRequest(`/conversations/${id}`),
  
  assign: (id: number, userId: number, teamId?: number) => 
    apiRequest(`/conversations/${id}/assign`, {
      method: 'PUT',
      body: JSON.stringify({ userId, teamId })
    }),

  autoAssign: (id: number, teamId: number) =>
    apiRequest(`/conversations/${id}/auto-assign`, {
      method: 'PUT',
      body: JSON.stringify({ teamId })
    }),

  updateStatus: (id: number, status: string, priority?: string) =>
    apiRequest(`/conversations/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, priority })
    }),

  metrics: (params?: {
    teamId?: number
    userId?: number
    startDate?: string
    endDate?: string
  }) => {
    const searchParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value))
        }
      })
    }
    const query = searchParams.toString()
    return apiRequest(`/conversations/metrics${query ? `?${query}` : ''}`)
  }
}

// MESSAGES API
export const messagesAPI = {
  list: (conversationId: number, page = 1, limit = 50) =>
    apiRequest(`/messages/conversation/${conversationId}?page=${page}&limit=${limit}`),

  send: (conversationId: number, content: string, type = 'text', metadata?: any) =>
    apiRequest(`/messages/conversation/${conversationId}`, {
      method: 'POST',
      body: JSON.stringify({ content, type, metadata })
    }),

  markAsRead: (conversationId: number) =>
    apiRequest(`/messages/conversation/${conversationId}/read`, {
      method: 'PUT'
    }),

  get: (id: number) => apiRequest(`/messages/${id}`)
}

// TEAMS API
export const teamsAPI = {
  list: () => apiRequest('/teams'),
  get: (id: number) => apiRequest(`/teams/${id}`),
  create: (data: { name: string; description?: string; color?: string }) =>
    apiRequest('/teams', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: { name?: string; description?: string; color?: string }) =>
    apiRequest(`/teams/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) => apiRequest(`/teams/${id}`, { method: 'DELETE' }),
  addMember: (id: number, userId: number) =>
    apiRequest(`/teams/${id}/members`, { method: 'POST', body: JSON.stringify({ userId }) }),
  removeMember: (id: number, userId: number) =>
    apiRequest(`/teams/${id}/members/${userId}`, { method: 'DELETE' }),
  metrics: (id: number, params?: { startDate?: string; endDate?: string }) => {
    const searchParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value))
        }
      })
    }
    const query = searchParams.toString()
    return apiRequest(`/teams/${id}/metrics${query ? `?${query}` : ''}`)
  }
}

// MACROS API
export const macrosAPI = {
  list: (params?: { category?: string; search?: string; isActive?: boolean }) => {
    const searchParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value))
        }
      })
    }
    const query = searchParams.toString()
    return apiRequest(`/macros${query ? `?${query}` : ''}`)
  },

  get: (id: number) => apiRequest(`/macros/${id}`),
  create: (data: { name: string; content: string; shortcut?: string; category?: string }) =>
    apiRequest('/macros', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: { name?: string; content?: string; shortcut?: string; category?: string; isActive?: boolean }) =>
    apiRequest(`/macros/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) => apiRequest(`/macros/${id}`, { method: 'DELETE' }),
  use: (id: number) => apiRequest(`/macros/${id}/use`, { method: 'POST' }),
  getByShortcut: (shortcut: string) => apiRequest(`/macros/shortcut/${shortcut}`),
  categories: () => apiRequest('/macros/categories')
}

export async function logout(refreshToken: string) {
  const res = await fetch(`${API_BASE}/auth/logout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken })
  })
  return res.json()
}

export async function checkout(amount: number) {
  const res = await fetch(`${API_BASE}/billing/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount })
  })
  return res.json()
}

export async function getQR() {
  const res = await fetch(`${API_BASE}/evolution/qr`)
  return res.json()
}

export async function getStatus() {
  const res = await fetch(`${API_BASE}/evolution/status`)
  return res.json()
}

export async function sendMessage(to: string, message: string) {
  const res = await fetch(`${API_BASE}/evolution/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to, message })
  })
  return res.json()
}

export async function getStats(token: string) {
  const res = await fetch(`${API_BASE}/stats`, { headers: { Authorization: `Bearer ${token}` } })
  return res.json()
}

// Plans & Subscriptions
export async function getPlans() {
  const res = await fetch(`${API_BASE}/plans`)
  return res.json()
}

export async function createOrUpdatePlan(plan: { name: string; priceCents: number; interval: 'month'|'year'; features?: any; active?: boolean }) {
  const res = await fetch(`${API_BASE}/plans`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(plan)
  })
  return res.json()
}

export async function subscribe(planId: number, token: string) {
  const res = await fetch(`${API_BASE}/subscriptions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ planId })
  })
  return res.json()
}

export async function getMySubscription(token: string) {
  const res = await fetch(`${API_BASE}/subscriptions/me`, { headers: { Authorization: `Bearer ${token}` } })
  return res.json()
}

export async function cancelSubscription(token: string) {
  const res = await fetch(`${API_BASE}/subscriptions/cancel`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } })
  return res.json()
}

// Contacts
export async function getContacts(token: string, params?: { search?: string; status?: string; tags?: string[]; limit?: number; offset?: number }) {
  const qs = new URLSearchParams()
  if (params?.search) qs.set('search', params.search)
  if (params?.status) qs.set('status', params.status)
  if (params?.tags && params.tags.length) params.tags.forEach(t => qs.append('tags', t))
  if (params?.limit) qs.set('limit', String(params.limit))
  if (params?.offset) qs.set('offset', String(params.offset))
  const res = await fetch(`${API_BASE}/contacts${qs.toString() ? `?${qs}` : ''}`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  if (!res.ok) throw new Error('Falha ao carregar contatos')
  return res.json()
}

export async function createContact(token: string, payload: { name: string; phone: string; email?: string; company?: string; tags?: string[]; source?: string }) {
  const res = await fetch(`${API_BASE}/contacts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload)
  })
  if (!res.ok) throw new Error('Falha ao criar contato')
  return res.json()
}

export async function deleteContact(token: string, id: number) {
  const res = await fetch(`${API_BASE}/contacts/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  })
  if (!res.ok) throw new Error('Falha ao remover contato')
  return res.json()
}

// Campaigns
export async function getCampaigns(token: string) {
  const res = await fetch(`${API_BASE}/campaigns`, { headers: { Authorization: `Bearer ${token}` } })
  if (!res.ok) throw new Error('Falha ao carregar campanhas')
  return res.json()
}

export async function createCampaign(token: string, payload: { name: string; scheduledAt?: string | null }) {
  const res = await fetch(`${API_BASE}/campaigns`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload)
  })
  if (!res.ok) throw new Error('Falha ao criar campanha')
  return res.json()
}

export async function deleteCampaign(token: string, id: number) {
  const res = await fetch(`${API_BASE}/campaigns/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
  if (!res.ok) throw new Error('Falha ao remover campanha')
  return res.json()
}

// CHANNELS API
export const channelsAPI = {
  list: () => apiRequest('/channels'),
  
  get: (id: number) => apiRequest(`/channels/${id}`),
  
  create: (data: { 
    name: string; 
    type: string; 
    phone?: string; 
    config?: Record<string, any> 
  }) =>
    apiRequest('/channels', { 
      method: 'POST', 
      body: JSON.stringify(data) 
    }),
  
  update: (id: number, data: { 
    name?: string; 
    type?: string; 
    phone?: string; 
    config?: Record<string, any>; 
    status?: string 
  }) =>
    apiRequest(`/channels/${id}`, { 
      method: 'PUT', 
      body: JSON.stringify(data) 
    }),
  
  delete: (id: number) => 
    apiRequest(`/channels/${id}`, { method: 'DELETE' })
}
