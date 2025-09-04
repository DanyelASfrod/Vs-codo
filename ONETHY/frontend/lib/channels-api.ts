const API_BASE = '/api'

async function apiRequest(method: string, url: string, data?: any) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
  
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    },
    ...(data && { body: JSON.stringify(data) })
  }

  const response = await fetch(`${API_BASE}${url}`, options)
  
  if (!response.ok) {
    let message = `HTTP ${response.status}`
    try {
      const contentType = response.headers.get('content-type') || ''
      if (contentType.includes('application/json')) {
        const errorData = await response.json()
        message = errorData.message || message
      } else {
        const text = await response.text()
        message = text || message
      }
    } catch (_) {
      // mantém mensagem padrão
    }
    throw new Error(message)
  }

  return response.json()
}

// Tenta normalizar diferentes formatos de QR Code vindos do backend/Evolution API
function normalizeQRCode(qr: any): string | undefined {
  if (!qr) return undefined
  if (typeof qr === 'string') {
    // Se parecer base64 sem prefixo, adiciona prefixo png
    const looksBase64 = /^[A-Za-z0-9+/=]+$/.test(qr) && qr.length > 100
    if (looksBase64 && !qr.startsWith('data:image')) {
      return `data:image/png;base64,${qr}`
    }
    return qr
  }
  // Alguns provedores retornam objetos com diferentes chaves
  const candidates = [
    qr.base64,
    qr.image,
    qr.qrcode,
    qr.qr,
    qr.url,
    qr.data,
    qr.code,
  ].filter(Boolean)
  const first = candidates[0]
  if (!first) return undefined
  if (typeof first === 'string') {
    const looksBase64 = /^[A-Za-z0-9+/=]+$/.test(first) && first.length > 100
    if (looksBase64 && !first.startsWith('data:image')) {
      return `data:image/png;base64,${first}`
    }
    return first
  }
  return undefined
}

export interface Channel {
  id: number
  name: string
  type: string
  status: 'connected' | 'disconnected' | 'connecting' | 'error'
  phone?: string
  config?: any
  messagesCount: number
  lastActivity?: string
  createdAt: string
  updatedAt: string
}

export interface CreateWhatsAppInstanceRequest {
  name: string
  phone: string
}

export interface CreateWhatsAppInstanceResponse {
  success: boolean
  channel: Channel
  qrcode?: string
  instanceName: string
}

export interface ConnectInstanceResponse {
  success: boolean
  connectionData: any
  qrcode?: string
}

class ChannelsService {
  async getChannels(): Promise<Channel[]> {
    const response = await apiRequest('GET', '/channels')
    console.log('� API Response completa:', JSON.stringify(response, null, 2))
    return response.channels || []
  }

  async createChannel(data: { name: string; type: string; phone?: string; config?: any }): Promise<Channel> {
    const response = await apiRequest('POST', '/channels', data)
    return response.channel
  }

  async updateChannel(id: number, data: Partial<Channel>): Promise<Channel> {
    const response = await apiRequest('PUT', `/channels/${id}`, data)
    return response.channel
  }

  async deleteChannel(id: number): Promise<void> {
    await apiRequest('DELETE', `/channels/${id}`)
  }

  // WhatsApp specific methods
  async createWhatsAppInstance(data: CreateWhatsAppInstanceRequest): Promise<CreateWhatsAppInstanceResponse> {
    // Backend exige name e phone; se phone vier vazio, usamos um placeholder para evitar 400
    const sanitized = {
      name: data.name?.trim(),
      phone: (data.phone?.trim() || '0000000000')
    }
  const response = await apiRequest('POST', '/channels/whatsapp/create', sanitized)
  // Normaliza QR se vier em formato inesperado
  const normalized = { ...response }
  const qr = normalizeQRCode(response?.qrcode)
  if (qr) normalized.qrcode = qr
  return normalized
  }

  async connectWhatsAppInstance(instanceName: string): Promise<ConnectInstanceResponse> {
  const response = await apiRequest('GET', `/channels/whatsapp/connect/${instanceName}`)
  // Às vezes o QR vem dentro de connectionData
  const qrFromTop = normalizeQRCode(response?.qrcode)
    const qrFromData = normalizeQRCode(
      response?.connectionData?.qrcode ||
      response?.connectionData?.qrCode ||
      response?.connectionData?.base64
    )
  const normalized = { ...response, qrcode: qrFromTop || qrFromData }
  return normalized
  }

  async restartWhatsAppInstance(instanceName: string): Promise<{ success: boolean; message: string }> {
    const response = await apiRequest('POST', `/channels/whatsapp/restart/${instanceName}`)
    return response
  }

  async logoutWhatsAppInstance(instanceName: string): Promise<{ success: boolean; message: string }> {
    const response = await apiRequest('DELETE', `/channels/whatsapp/logout/${instanceName}`)
    return response
  }

  async syncInstances(): Promise<{ success: boolean; channels: Channel[] }> {
    const response = await apiRequest('POST', '/channels/sync')
    return response
  }
}

export const channelsService = new ChannelsService()
