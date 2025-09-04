// API client para inbox
const API_BASE = '/api'

// Helper function para fazer requisições autenticadas
async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem('token')
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...(options.headers as HeadersInit)
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Erro desconhecido' }))
    throw new Error(error.error || error.message || `Erro ${response.status}`)
  }

  return response.json()
}

// Helper functions for different HTTP methods
const api = {
  get: (endpoint: string, options?: { params?: Record<string, any> }) => {
    const url = new URL(`${API_BASE}${endpoint}`, window.location.origin)
    if (options?.params) {
      Object.entries(options.params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.set(key, String(value))
        }
      })
    }
    return apiRequest(url.pathname + url.search)
  },

  post: (endpoint: string, data?: any) => 
    apiRequest(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined
    }),

  put: (endpoint: string, data?: any) => 
    apiRequest(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined
    }),

  delete: (endpoint: string) => 
    apiRequest(endpoint, { method: 'DELETE' })
}

// Types
export interface Contact {
  id: number
  name: string
  phone: string
  email?: string
  avatar?: string
  notes?: string
  attributes?: ContactAttribute[]
  _count?: {
    conversations: number
  }
}

export interface ContactAttribute {
  id: number
  name: string
  value: string
  type: string
  contactId: number
}

export interface Conversation {
  id: number
  status: string
  priority: string
  lastMessage: string
  lastActivity: string
  unreadCount: number
  tags?: string[]
  contact: Contact
  channel: {
    id: number
    name: string
    type: string
  }
  assignedAgent?: {
    id: number
    name: string
    email: string
  }
  assignedTeam?: {
    id: number
    name: string
    color: string
  }
  _count?: {
    messages: number
    notes: number
  }
}

export interface Message {
  id: number
  content: string
  type: string
  fromMe: boolean
  status: string
  timestamp: string
  conversationId: number
}

export interface ConversationNote {
  id: number
  content: string
  isPrivate: boolean
  createdAt: string
  updatedAt: string
  conversationId: number
  user: {
    id: number
    name: string
    email: string
  }
}

export interface Macro {
  id: number
  name: string
  content: string
  shortcut?: string
  createdAt: string
  updatedAt: string
}

export interface Team {
  id: number
  name: string
  description?: string
  color: string
}

// API Functions
export class InboxAPI {
  // ====== CONVERSAS ======
  static async getConversations(params?: {
    status?: string
    priority?: string
    assignedAgentId?: number
    assignedTeamId?: number
    search?: string
    page?: number
    limit?: number
  }) {
  const response = await api.get('/inbox/conversations', { params })
  return response
  }

  static async getConversation(id: number) {
    const response = await api.get(`/inbox/conversations/${id}`)
    return response
  }

  static async updateConversation(id: number, data: {
    status?: string
    priority?: string
    assignedAgentId?: number | null
    assignedTeamId?: number | null
    tags?: string[]
  }) {
  const response = await api.put(`/inbox/conversations/${id}`, data)
  return response
  }

  static async assignToMe(id: number) {
  const response = await api.post(`/inbox/conversations/${id}/assign-to-me`)
  return response
  }

  static async markAsRead(id: number) {
  const response = await api.post(`/inbox/conversations/${id}/mark-as-read`)
  return response
  }

  // ====== MENSAGENS ======
  static async getMessages(conversationId: number, params?: {
    page?: number
    limit?: number
  }) {
  const response = await api.get(`/inbox/conversations/${conversationId}/messages`, { params })
  return response
  }

  static async sendMessage(conversationId: number, data: {
    content: string
    type?: string
  }) {
  const response = await api.post(`/inbox/conversations/${conversationId}/messages`, data)
  return response
  }

  // ====== NOTAS ======
  static async getConversationNotes(conversationId: number) {
  const response = await api.get(`/inbox/conversations/${conversationId}/notes`)
  return response
  }

  static async createNote(conversationId: number, data: {
    content: string
    isPrivate?: boolean
  }) {
  const response = await api.post(`/inbox/conversations/${conversationId}/notes`, data)
  return response
  }

  static async updateNote(id: number, data: {
    content?: string
    isPrivate?: boolean
  }) {
  const response = await api.put(`/inbox/notes/${id}`, data)
  return response
  }

  static async deleteNote(id: number) {
  const response = await api.delete(`/inbox/notes/${id}`)
  return response
  }

  // ====== MACROS ======
  static async getMacros() {
  const response = await api.get('/inbox/macros')
  return response
  }

  static async createMacro(data: {
    name: string
    content: string
    shortcut?: string
  }) {
  const response = await api.post('/inbox/macros', data)
  return response
  }

  static async updateMacro(id: number, data: {
    name?: string
    content?: string
    shortcut?: string
  }) {
  const response = await api.put(`/inbox/macros/${id}`, data)
  return response
  }

  static async deleteMacro(id: number) {
  const response = await api.delete(`/inbox/macros/${id}`)
  return response
  }

  static async applyMacro(conversationId: number, macroId: number) {
  const response = await api.post(`/inbox/conversations/${conversationId}/macros/${macroId}/apply`)
  return response
  }

  // ====== CONTATOS ======
  static async getContacts(params?: {
    search?: string
    page?: number
    limit?: number
  }) {
  const response = await api.get('/inbox/contacts', { params })
  return response
  }

  static async getContact(id: number) {
  const response = await api.get(`/inbox/contacts/${id}`)
  return response
  }

  static async createContact(data: {
    name: string
    phone: string
    email?: string
    avatar?: string
    notes?: string
    attributes?: { name: string; value: string; type?: string }[]
  }) {
  const response = await api.post('/inbox/contacts', data)
  return response
  }

  static async updateContact(id: number, data: {
    name?: string
    phone?: string
    email?: string
    avatar?: string
    notes?: string
  }) {
  const response = await api.put(`/inbox/contacts/${id}`, data)
  return response
  }

  static async deleteContact(id: number) {
  const response = await api.delete(`/inbox/contacts/${id}`)
  return response
  }

  // ====== ATRIBUTOS DE CONTATOS ======
  static async getContactAttributes(contactId: number) {
  const response = await api.get(`/inbox/contacts/${contactId}/attributes`)
  return response
  }

  static async createContactAttribute(contactId: number, data: {
    name: string
    value: string
    type?: string
  }) {
  const response = await api.post(`/inbox/contacts/${contactId}/attributes`, data)
  return response
  }

  static async updateContactAttribute(id: number, data: {
    name?: string
    value?: string
    type?: string
  }) {
  const response = await api.put(`/inbox/attributes/${id}`, data)
  return response
  }

  static async deleteContactAttribute(id: number) {
  const response = await api.delete(`/inbox/attributes/${id}`)
  return response
  }
}

// Hook personalizado para usar a API da inbox
export function useInboxAPI() {
  return {
    conversations: {
      list: InboxAPI.getConversations,
      get: InboxAPI.getConversation,
      update: InboxAPI.updateConversation,
      assignToMe: InboxAPI.assignToMe,
      markAsRead: InboxAPI.markAsRead
    },
    messages: {
      list: InboxAPI.getMessages,
      send: InboxAPI.sendMessage
    },
    notes: {
      list: InboxAPI.getConversationNotes,
      create: InboxAPI.createNote,
      update: InboxAPI.updateNote,
      delete: InboxAPI.deleteNote
    },
    macros: {
      list: InboxAPI.getMacros,
      create: InboxAPI.createMacro,
      update: InboxAPI.updateMacro,
      delete: InboxAPI.deleteMacro,
      apply: InboxAPI.applyMacro
    },
    contacts: {
      list: InboxAPI.getContacts,
      get: InboxAPI.getContact,
      create: InboxAPI.createContact,
      update: InboxAPI.updateContact,
      delete: InboxAPI.deleteContact,
      getAttributes: InboxAPI.getContactAttributes,
      createAttribute: InboxAPI.createContactAttribute,
      updateAttribute: InboxAPI.updateContactAttribute,
      deleteAttribute: InboxAPI.deleteContactAttribute
    }
  }
}

export default InboxAPI
