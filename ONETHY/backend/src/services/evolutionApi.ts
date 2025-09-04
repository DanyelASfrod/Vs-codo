import axios from 'axios'
import { prisma } from '../lib/db'

interface EvolutionApiConfig {
  baseUrl: string
  apiKey: string
}

interface CreateInstanceRequest {
  instanceName: string
  qrcode: boolean
  integration: string
}

interface InstanceResponse {
  instanceName: string
  status: string
  qrcode?: string
}

class EvolutionApiService {
  private config: EvolutionApiConfig

  constructor() {
    this.config = {
      baseUrl: process.env.EVOLUTION_API_URL || 'https://api.onethy.com',
      apiKey: process.env.EVOLUTION_API_KEY || '12345678'
    }
  }

  private getHeaders() {
    return {
      'Content-Type': 'application/json',
      'apikey': this.config.apiKey
    }
  }

  async createInstance(instanceName: string, webhookUrl?: string): Promise<InstanceResponse> {
    try {
      const data: CreateInstanceRequest = {
        instanceName,
        qrcode: true,
        integration: 'WHATSAPP-BAILEYS'
      }

      const response = await axios.post(
        `${this.config.baseUrl}/instance/create`,
        data,
        { headers: this.getHeaders() }
      )

      // Se webhookUrl foi fornecido, configura o webhook
      if (webhookUrl) {
        try {
          await this.setWebhook(instanceName, webhookUrl)
          console.log(`Webhook configurado para instância ${instanceName}`)
        } catch (error) {
          console.error(`Erro ao configurar webhook para ${instanceName}:`, error)
        }
      }

      return response.data
    } catch (error) {
      console.error('Erro ao criar instância:', error)
      throw new Error('Falha ao criar instância WhatsApp')
    }
  }

  async connectInstance(instanceName: string): Promise<any> {
    try {
      const response = await axios.get(
        `${this.config.baseUrl}/instance/connect/${instanceName}`,
        { headers: this.getHeaders() }
      )

      return response.data
    } catch (error) {
      console.error('Erro ao conectar instância:', error)
      throw new Error('Falha ao conectar instância')
    }
  }

  async fetchInstances(): Promise<any> {
    try {
      const response = await axios.get(
        `${this.config.baseUrl}/instance/fetchInstances`,
        { headers: this.getHeaders() }
      )

      return response.data
    } catch (error) {
      console.error('Erro ao buscar instâncias:', error)
      throw new Error('Falha ao buscar instâncias')
    }
  }

  async restartInstance(instanceName: string): Promise<any> {
    try {
      const response = await axios.post(
        `${this.config.baseUrl}/instance/restart/${instanceName}`,
        {},
        { headers: this.getHeaders() }
      )

      return response.data
    } catch (error) {
      console.error('Erro ao reiniciar instância:', error)
      throw new Error('Falha ao reiniciar instância')
    }
  }

  async logoutInstance(instanceName: string): Promise<any> {
    try {
      const response = await axios.delete(
        `${this.config.baseUrl}/instance/logout/${instanceName}`,
        { headers: this.getHeaders() }
      )

      return response.data
    } catch (error) {
      console.error('Erro ao fazer logout da instância:', error)
      throw new Error('Falha ao fazer logout da instância')
    }
  }

  async deleteInstance(instanceName: string): Promise<any> {
    try {
      const response = await axios.delete(
        `${this.config.baseUrl}/instance/delete/${instanceName}`,
        { headers: this.getHeaders() }
      )

      return response.data
    } catch (error) {
      console.error('Erro ao deletar instância:', error)
      throw new Error('Falha ao deletar instância')
    }
  }

  async setWebhook(instanceName: string, webhookUrl: string): Promise<any> {
    try {
      const data = {
        webhook: {
          enabled: true,
          url: webhookUrl,
          headers: {
            "Content-Type": "application/json"
          },
          byEvents: false,
          base64: false,
          events: [
            "APPLICATION_STARTUP",
            "QRCODE_UPDATED",
            "MESSAGES_SET",
            "MESSAGES_UPSERT",
            "MESSAGES_UPDATE",
            "MESSAGES_DELETE",
            "SEND_MESSAGE",
            "CONTACTS_SET",
            "CONTACTS_UPSERT",
            "CONTACTS_UPDATE",
            "PRESENCE_UPDATE",
            "CHATS_SET",
            "CHATS_UPSERT",
            "CHATS_UPDATE",
            "CHATS_DELETE",
            "GROUPS_UPSERT",
            "GROUP_UPDATE",
            "GROUP_PARTICIPANTS_UPDATE",
            "CONNECTION_UPDATE",
            "LABELS_EDIT",
            "LABELS_ASSOCIATION",
            "CALL",
            "TYPEBOT_START",
            "TYPEBOT_CHANGE_STATUS"
          ]
        }
      }

      const response = await axios.post(
        `${this.config.baseUrl}/webhook/set/${instanceName}`,
        data,
        { headers: this.getHeaders() }
      )

      return response.data
    } catch (error) {
      console.error('Erro ao configurar webhook:', error)
      throw new Error('Falha ao configurar webhook')
    }
  }

  // Sincroniza instâncias do Evolution API com o banco de dados
  async syncInstancesWithDatabase(userId: number): Promise<void> {
    try {
      const instances = await this.fetchInstances()
      
      for (const instance of instances) {
        // Verifica se já existe no banco
        const existingChannel = await prisma.channel.findFirst({
          where: {
            userId,
            name: instance.instanceName,
            type: 'whatsapp'
          }
        })

        if (existingChannel) {
          // Atualiza status se já existe
          await prisma.channel.update({
            where: { id: existingChannel.id },
            data: {
              status: instance.status === 'open' ? 'connected' : 'disconnected',
              lastActivity: new Date(),
              config: {
                ...existingChannel.config as object,
                evolutionInstance: instance.instanceName
              }
            }
          })
        } else {
          // Cria novo canal se não existe
          await prisma.channel.create({
            data: {
              userId,
              name: instance.instanceName,
              type: 'whatsapp',
              status: instance.status === 'open' ? 'connected' : 'disconnected',
              phone: instance.number || null,
              config: {
                evolutionInstance: instance.instanceName,
                autoReply: false,
                autoReplyMessage: '',
                workingHours: {
                  enabled: false,
                  timezone: 'America/Sao_Paulo',
                  schedule: {}
                }
              },
              messagesCount: 0,
              lastActivity: new Date()
            }
          })
        }
      }
    } catch (error) {
      console.error('Erro ao sincronizar instâncias:', error)
    }
  }
}

export const evolutionApiService = new EvolutionApiService()
