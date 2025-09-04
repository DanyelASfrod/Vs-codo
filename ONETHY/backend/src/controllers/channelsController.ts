import { prisma } from '../lib/db'
import { Request, Response } from 'express'
import { evolutionApiService } from '../services/evolutionApi'

export async function getChannels(req: Request & { user?: { id: number } }, res: Response) {
  try {
    const channels = await prisma.channel.findMany({
      where: { userId: req.user?.id },
      orderBy: { createdAt: 'desc' }
    })
    res.json({ channels })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erro ao buscar canais', error: String(err) })
  }
}

export async function createChannel(req: Request & { user?: { id: number } }, res: Response) {
  try {
    const { name, type, phone, config } = req.body
    if (!name || !type) return res.status(400).json({ success: false, message: 'Nome e tipo obrigatórios' })
    const channel = await prisma.channel.create({
      data: {
        userId: req.user!.id,
        name,
        type,
        phone,
        config,
        status: 'disconnected',
        messagesCount: 0
      }
    })
    res.json({ success: true, channel })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erro ao criar canal', error: String(err) })
  }
}

export async function updateChannel(req: Request & { user?: { id: number } }, res: Response) {
  try {
    const { id } = req.params
    const { name, type, phone, config, status } = req.body
    const channel = await prisma.channel.update({
      where: { id: Number(id), userId: req.user?.id },
      data: {
        ...(name && { name }),
        ...(type && { type }),
        ...(phone && { phone }),
        ...(config && { config }),
        ...(status && { status }),
        lastActivity: new Date()
      }
    })
    res.json({ success: true, channel })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erro ao atualizar canal', error: String(err) })
  }
}

export async function deleteChannel(req: Request & { user?: { id: number } }, res: Response) {
  try {
    const { id } = req.params
    
    // Busca o canal antes de deletar para pegar o nome da instância
    const channel = await prisma.channel.findUnique({
      where: { id: Number(id), userId: req.user?.id }
    })

    if (!channel) {
      return res.status(404).json({ success: false, message: 'Canal não encontrado' })
    }

    // Se for WhatsApp, deleta também na Evolution API
    if (channel.type === 'whatsapp' && channel.config && (channel.config as any).evolutionInstance) {
      try {
        await evolutionApiService.deleteInstance((channel.config as any).evolutionInstance)
      } catch (error: any) {
        console.error('Erro ao deletar instância na Evolution API:', error)
        return res.status(500).json({ success: false, message: 'Erro ao excluir instância na Evolution API', error: error?.message || String(error) })
      }
    }

    await prisma.channel.delete({
      where: { id: Number(id), userId: req.user?.id }
    })
    
    res.json({ success: true, message: 'Canal excluído com sucesso' })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erro ao excluir canal', error: String(err) })
  }
}

// Novas funções para gerenciar instâncias WhatsApp
export async function createWhatsAppInstance(req: Request & { user?: { id: number } }, res: Response) {
  try {
    const { name, phone } = req.body
    
    console.log('Backend - Criando instância:', { name, phone, userId: req.user?.id })
    
    if (!name || !phone) {
      return res.status(400).json({ success: false, message: 'Nome e telefone são obrigatórios' })
    }

    // Sanitiza o nome da instância (remove espaços e caracteres especiais)
    let instanceName = name.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase()
    
    console.log('Backend - Nome sanitizado:', instanceName)
    
    // Adiciona o ID do usuário para garantir unicidade entre clientes
    instanceName = `${instanceName}_${req.user!.id}`
    
    console.log('Backend - Nome com user ID:', instanceName)
    
    // Verifica se já existe uma instância com esse nome para este usuário
    const existingChannel = await prisma.channel.findFirst({
      where: {
        userId: req.user!.id,
        config: {
          path: ['evolutionInstance'],
          equals: instanceName
        }
      }
    })
    
    // Se já existe, adiciona um sufixo único
    if (existingChannel) {
      instanceName = `${instanceName}_${Date.now()}`
    }
    
    // Cria o canal no banco primeiro para ter o webhook único
    const channel = await prisma.channel.create({
      data: {
        userId: req.user!.id,
        name,
        type: 'whatsapp',
        phone,
        status: 'connecting',
        config: {
          evolutionInstance: instanceName,
          autoReply: false,
          autoReplyMessage: '',
          workingHours: {
            enabled: false,
            timezone: 'America/Sao_Paulo',
            schedule: {}
          }
        },
        messagesCount: 0
      }
    })
    
    console.log('Backend - Canal criado:', {
      channelId: channel.id,
      channelName: channel.name,
      evolutionInstance: (channel.config as any)?.evolutionInstance
    })
    
    // Constrói a URL do webhook usando o webhook único do canal
    const webhookUrl = `${process.env.BASE_URL || 'http://localhost:4000'}/webhook/${channel.webhook}`
    
    // Cria a instância na Evolution API com webhook
    const evolutionResponse = await evolutionApiService.createInstance(instanceName, webhookUrl)

    console.log('Backend - Resposta Evolution:', {
      instanceName,
      hasQrcode: !!evolutionResponse.qrcode
    })

    const responseData = { 
      success: true, 
      channel,
      qrcode: evolutionResponse.qrcode,
      instanceName 
    }
    
    console.log('Backend - Resposta final:', {
      instanceName: responseData.instanceName,
      channelEvolutionInstance: (responseData.channel.config as any)?.evolutionInstance
    })
    
    res.json(responseData)
  } catch (err) {
    console.error('Erro ao criar instância WhatsApp:', err)
    res.status(500).json({ success: false, message: 'Erro ao criar instância WhatsApp', error: String(err) })
  }
}

export async function connectWhatsAppInstance(req: Request & { user?: { id: number } }, res: Response) {
  try {
    const { instanceName } = req.params
    
    // Conecta na Evolution API
    const connectionData = await evolutionApiService.connectInstance(instanceName)
    
    // Atualiza status no banco de dados
    await prisma.channel.updateMany({
      where: { 
        userId: req.user?.id,
        config: {
          path: ['evolutionInstance'],
          equals: instanceName
        }
      },
      data: {
        status: 'connecting',
        lastActivity: new Date()
      }
    })

    res.json({ 
      success: true, 
      connectionData,
      qrcode: connectionData.qrcode 
    })
  } catch (err) {
    console.error('Erro ao conectar instância:', err)
    res.status(500).json({ success: false, message: 'Erro ao conectar instância', error: String(err) })
  }
}

export async function restartWhatsAppInstance(req: Request & { user?: { id: number } }, res: Response) {
  try {
    const { instanceName } = req.params
    
    // Reinicia na Evolution API
    await evolutionApiService.restartInstance(instanceName)
    
    // Atualiza status no banco de dados
    await prisma.channel.updateMany({
      where: { 
        userId: req.user?.id,
        config: {
          path: ['evolutionInstance'],
          equals: instanceName
        }
      },
      data: {
        status: 'connecting',
        lastActivity: new Date()
      }
    })

    res.json({ success: true, message: 'Instância reiniciada com sucesso' })
  } catch (err) {
    console.error('Erro ao reiniciar instância:', err)
    res.status(500).json({ success: false, message: 'Erro ao reiniciar instância', error: String(err) })
  }
}

export async function logoutWhatsAppInstance(req: Request & { user?: { id: number } }, res: Response) {
  try {
    const { instanceName } = req.params
    
    // Faz logout na Evolution API
    await evolutionApiService.logoutInstance(instanceName)
    
    // Atualiza status no banco de dados
    await prisma.channel.updateMany({
      where: { 
        userId: req.user?.id,
        config: {
          path: ['evolutionInstance'],
          equals: instanceName
        }
      },
      data: {
        status: 'disconnected',
        lastActivity: new Date()
      }
    })

    res.json({ success: true, message: 'Logout realizado com sucesso' })
  } catch (err) {
    console.error('Erro ao fazer logout:', err)
    res.status(500).json({ success: false, message: 'Erro ao fazer logout', error: String(err) })
  }
}

export async function syncInstances(req: Request & { user?: { id: number } }, res: Response) {
  try {
    await evolutionApiService.syncInstancesWithDatabase(req.user!.id)
    
    // Busca canais atualizados
    const channels = await prisma.channel.findMany({
      where: { userId: req.user?.id },
      orderBy: { createdAt: 'desc' }
    })

    res.json({ success: true, channels })
  } catch (err) {
    console.error('Erro ao sincronizar instâncias:', err)
    res.status(500).json({ success: false, message: 'Erro ao sincronizar instâncias', error: String(err) })
  }
}
