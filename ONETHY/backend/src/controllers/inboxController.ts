import { Response } from 'express'
import { db } from '../lib/db'
import { AuthRequest } from '../types'

// Listar conversas do usuário
export const getConversations = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' })
    }

    const { 
      status, 
      priority, 
      assignedAgentId, 
      assignedTeamId, 
      search, 
      page = 1, 
      limit = 20 
    } = req.query

    const skip = (Number(page) - 1) * Number(limit)

    const whereClause: any = {
      userId,
      ...(status && { status: status as string }),
      ...(priority && { priority: priority as string }),
      ...(assignedAgentId && { assignedAgentId: Number(assignedAgentId) }),
      ...(assignedTeamId && { assignedTeamId: Number(assignedTeamId) }),
      ...(search && {
        OR: [
          { contact: { name: { contains: search as string, mode: 'insensitive' } } },
          { contact: { phone: { contains: search as string } } },
          { lastMessage: { contains: search as string, mode: 'insensitive' } }
        ]
      })
    }

    const conversations = await db.conversation.findMany({
      where: whereClause,
      include: {
        contact: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            avatar: true
          }
        },
        channel: {
          select: {
            id: true,
            name: true,
            type: true
          }
        },
        assignedAgent: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        assignedTeam: {
          select: {
            id: true,
            name: true,
            color: true
          }
        },
        _count: {
          select: {
            messages: true,
            notes: true
          }
        }
      },
      orderBy: {
        lastActivity: 'desc'
      },
      skip,
      take: Number(limit)
    })

    const total = await db.conversation.count({ where: whereClause })

    res.json({
      conversations,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    })
  } catch (error) {
    console.error('Erro ao buscar conversas:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
}

// Buscar uma conversa específica
export const getConversation = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id
    const { id } = req.params

    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' })
    }

    const conversation = await db.conversation.findFirst({
      where: {
        id: Number(id),
        userId
      },
      include: {
        contact: {
          include: {
            attributes: true
          }
        },
        channel: true,
        assignedAgent: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        assignedTeam: {
          select: {
            id: true,
            name: true,
            color: true
          }
        },
        messages: {
          orderBy: {
            timestamp: 'asc'
          },
          take: 50 // Últimas 50 mensagens
        },
        notes: {
          include: {
            user: {
              select: {
                id: true,
                name: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    })

    if (!conversation) {
      return res.status(404).json({ error: 'Conversa não encontrada' })
    }

    res.json(conversation)
  } catch (error) {
    console.error('Erro ao buscar conversa:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
}

// Atualizar conversa (status, prioridade, agente, equipe, tags)
export const updateConversation = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id
    const { id } = req.params
    const { 
      status, 
      priority, 
      assignedAgentId, 
      assignedTeamId, 
      tags 
    } = req.body

    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' })
    }

    // Verificar se a conversa existe e pertence ao usuário
    const existingConversation = await db.conversation.findFirst({
      where: {
        id: Number(id),
        userId
      }
    })

    if (!existingConversation) {
      return res.status(404).json({ error: 'Conversa não encontrada' })
    }

    const updatedConversation = await db.conversation.update({
      where: {
        id: Number(id)
      },
      data: {
        ...(status && { status }),
        ...(priority && { priority }),
        ...(assignedAgentId !== undefined && { assignedAgentId: assignedAgentId ? Number(assignedAgentId) : null }),
        ...(assignedTeamId !== undefined && { assignedTeamId: assignedTeamId ? Number(assignedTeamId) : null }),
        ...(tags && { tags }),
        updatedAt: new Date()
      },
      include: {
        contact: true,
        assignedAgent: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        assignedTeam: {
          select: {
            id: true,
            name: true,
            color: true
          }
        }
      }
    })

    res.json(updatedConversation)
  } catch (error) {
    console.error('Erro ao atualizar conversa:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
}

// Atribuir conversa a mim
export const assignToMe = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id
    const { id } = req.params

    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' })
    }

    const updatedConversation = await db.conversation.update({
      where: {
        id: Number(id),
        userId
      },
      data: {
        assignedAgentId: userId,
        updatedAt: new Date()
      },
      include: {
        contact: true,
        assignedAgent: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    res.json(updatedConversation)
  } catch (error) {
    console.error('Erro ao atribuir conversa:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
}

// Buscar mensagens de uma conversa
export const getMessages = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id
    const { id } = req.params
    const { page = 1, limit = 50 } = req.query

    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' })
    }

    const skip = (Number(page) - 1) * Number(limit)

    // Verificar se a conversa pertence ao usuário
    const conversation = await db.conversation.findFirst({
      where: {
        id: Number(id),
        userId
      }
    })

    if (!conversation) {
      return res.status(404).json({ error: 'Conversa não encontrada' })
    }

    const messages = await db.message.findMany({
      where: {
        conversationId: Number(id)
      },
      orderBy: {
        timestamp: 'desc'
      },
      skip,
      take: Number(limit)
    })

    // Inverter a ordem para mostrar as mensagens mais antigas primeiro
    messages.reverse()

    const total = await db.message.count({
      where: {
        conversationId: Number(id)
      }
    })

    res.json({
      messages,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    })
  } catch (error) {
    console.error('Erro ao buscar mensagens:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
}

// Enviar mensagem
export const sendMessage = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id
    const { id } = req.params
    const { content, type = 'text' } = req.body

    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' })
    }

    if (!content) {
      return res.status(400).json({ error: 'Conteúdo da mensagem é obrigatório' })
    }

    // Verificar se a conversa pertence ao usuário
    const conversation = await db.conversation.findFirst({
      where: {
        id: Number(id),
        userId
      },
      include: {
        contact: true
      }
    })

    if (!conversation) {
      return res.status(404).json({ error: 'Conversa não encontrada' })
    }

    // Criar a mensagem
    const message = await db.message.create({
      data: {
        userId,
        conversationId: Number(id),
        content,
        type,
        fromMe: true,
        status: 'sent'
      }
    })

    // Atualizar a conversa com a última mensagem
    await db.conversation.update({
      where: {
        id: Number(id)
      },
      data: {
        lastMessage: content,
        lastActivity: new Date(),
        updatedAt: new Date()
      }
    })

    // Aqui você integraria com a API do WhatsApp ou outro provedor
    // para enviar a mensagem de fato
    
    res.json(message)
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
}

// Marcar mensagens como lidas
export const markAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id
    const { id } = req.params

    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' })
    }

    // Verificar se a conversa pertence ao usuário
    const conversation = await db.conversation.findFirst({
      where: {
        id: Number(id),
        userId
      }
    })

    if (!conversation) {
      return res.status(404).json({ error: 'Conversa não encontrada' })
    }

    // Marcar mensagens não lidas como lidas
    await db.message.updateMany({
      where: {
        conversationId: Number(id),
        fromMe: false,
        status: { not: 'read' }
      },
      data: {
        status: 'read'
      }
    })

    // Resetar contador de mensagens não lidas
    await db.conversation.update({
      where: {
        id: Number(id)
      },
      data: {
        unreadCount: 0
      }
    })

    res.json({ success: true })
  } catch (error) {
    console.error('Erro ao marcar como lido:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
}
