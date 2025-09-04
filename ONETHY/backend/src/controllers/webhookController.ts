import { Request, Response } from 'express'
import { prisma } from '../lib/db'

// Controller para receber webhooks das instâncias WhatsApp
export async function receiveWebhook(req: Request, res: Response) {
  try {
    const { webhook } = req.params
    const webhookData = req.body

    console.log(`[WEBHOOK] Recebido para canal ${webhook}:`, JSON.stringify(webhookData, null, 2))

    // Busca o canal pelo webhook
    const channel = await prisma.channel.findUnique({
      where: { webhook }
    })

    if (!channel) {
      console.log(`[WEBHOOK] Canal não encontrado para webhook: ${webhook}`)
      return res.status(404).json({ error: 'Canal não encontrado' })
    }

    // Processa diferentes tipos de mensagem
    if (webhookData.event === 'messages.upsert') {
      await processIncomingMessage(channel, webhookData)
    } else if (webhookData.event === 'connection.update') {
      await processConnectionUpdate(channel, webhookData)
    }

    res.status(200).json({ success: true, message: 'Webhook processado' })
  } catch (error) {
    console.error('[WEBHOOK] Erro ao processar webhook:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
}

async function processIncomingMessage(channel: any, webhookData: any) {
  try {
    const { data } = webhookData
    
    if (!data || !data.messages || data.messages.length === 0) {
      return
    }

    const message = data.messages[0]
    
    // Verifica se é uma mensagem recebida (não enviada)
    if (message.key.fromMe) {
      return
    }

    const phoneNumber = message.key.remoteJid.replace('@s.whatsapp.net', '')
    
    // Busca ou cria o contato
    let contact = await prisma.contact.findFirst({
      where: {
        userId: channel.userId,
        phone: phoneNumber
      }
    })

    if (!contact) {
      contact = await prisma.contact.create({
        data: {
          userId: channel.userId,
          name: message.pushName || phoneNumber,
          phone: phoneNumber,
          email: null,
          channelId: channel.id,
          tags: [],
          notes: '',
          lastContact: new Date()
        }
      })
    }

    // Busca ou cria a conversa
    let conversation = await prisma.conversation.findFirst({
      where: {
        contactId: contact.id,
        channelId: channel.id,
        status: { not: 'closed' }
      }
    })

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          contactId: contact.id,
          userId: channel.userId,
          channelId: channel.id,
          status: 'open',
          priority: 'medium',
          subject: 'Nova conversa WhatsApp',
          lastMessageAt: new Date()
        }
      })
    }

    // Cria a mensagem
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        userId: channel.userId,
        content: message.message?.conversation || message.message?.extendedTextMessage?.text || 'Mensagem de mídia',
        type: getMessageType(message.message),
        direction: 'inbound',
        metadata: {
          whatsappId: message.key.id,
          timestamp: message.messageTimestamp,
          fromJid: message.key.remoteJid,
          pushName: message.pushName
        }
      }
    })

    // Atualiza contadores
    await prisma.channel.update({
      where: { id: channel.id },
      data: {
        messagesCount: { increment: 1 },
        lastActivity: new Date()
      }
    })

    await prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        lastMessageAt: new Date(),
        unreadCount: { increment: 1 }
      }
    })

    console.log(`[WEBHOOK] Mensagem processada para canal ${channel.name}`)
  } catch (error) {
    console.error('[WEBHOOK] Erro ao processar mensagem:', error)
  }
}

async function processConnectionUpdate(channel: any, webhookData: any) {
  try {
    const { data } = webhookData
    
    if (!data || !data.connection) {
      return
    }

    const connection = data.connection
    let status = 'disconnected'

    if (connection.state === 'open') {
      status = 'connected'
    } else if (connection.state === 'connecting') {
      status = 'connecting'
    } else if (connection.state === 'close') {
      status = 'disconnected'
    }

    // Atualiza status do canal
    await prisma.channel.update({
      where: { id: channel.id },
      data: {
        status,
        lastActivity: new Date()
      }
    })

    console.log(`[WEBHOOK] Status do canal ${channel.name} atualizado para: ${status}`)
  } catch (error) {
    console.error('[WEBHOOK] Erro ao processar atualização de conexão:', error)
  }
}

function getMessageType(messageContent: any): string {
  if (messageContent.conversation || messageContent.extendedTextMessage) {
    return 'text'
  } else if (messageContent.imageMessage) {
    return 'image'
  } else if (messageContent.videoMessage) {
    return 'video'
  } else if (messageContent.audioMessage) {
    return 'audio'
  } else if (messageContent.documentMessage) {
    return 'document'
  } else {
    return 'unknown'
  }
}
