import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../types';

const prisma = new PrismaClient();

// Buscar mensagens de uma conversa
export const getMessages = async (req: AuthRequest, res: Response) => {
  try {
    const { conversationId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where: {
          conversationId: parseInt(conversationId)
        },
        skip,
        take: Number(limit),
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: {
          createdAt: 'asc'
        }
      }),
      prisma.message.count({
        where: {
          conversationId: parseInt(conversationId)
        }
      })
    ]);

    res.json({
      messages,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Erro ao buscar mensagens:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Enviar mensagem
export const sendMessage = async (req: AuthRequest, res: Response) => {
  try {
    const { conversationId } = req.params;
    const { content, type = 'text', metadata } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    // Verificar se a conversa existe
    const conversation = await prisma.conversation.findUnique({
      where: { id: parseInt(conversationId) }
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversa não encontrada' });
    }

    // Criar a mensagem
    const message = await prisma.message.create({
      data: {
        conversationId: parseInt(conversationId),
        userId,
        content,
        type,
        metadata: metadata || {},
        fromMe: true,
        status: 'sent'
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Atualizar a conversa com a última mensagem e atividade
    await prisma.conversation.update({
      where: { id: parseInt(conversationId) },
      data: {
        lastMessage: content.substring(0, 100),
        lastActivity: new Date(),
        status: 'open'
      }
    });

    res.json(message);
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Marcar mensagem como lida
export const markAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const { conversationId } = req.params;

    await prisma.message.updateMany({
      where: {
        conversationId: parseInt(conversationId),
        status: { in: ['sent', 'delivered'] },
        fromMe: false
      },
      data: {
        status: 'read'
      }
    });

    // Zerar contador de não lidas na conversa
    await prisma.conversation.update({
      where: { id: parseInt(conversationId) },
      data: {
        unreadCount: 0
      }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao marcar como lida:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Receber mensagem externa (webhook)
export const receiveMessage = async (req: Request, res: Response) => {
  try {
    const { 
      conversationId, 
      content, 
      type = 'text', 
      metadata,
      fromContact = true,
      whatsappId,
      timestamp 
    } = req.body;

    // Buscar ou criar conversa
    let conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { contact: true }
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversa não encontrada' });
    }

    // Criar a mensagem
    const message = await prisma.message.create({
      data: {
        conversationId,
        userId: conversation.userId, // Usar o userId da conversa
        content,
        type,
        metadata: metadata || {},
        fromMe: !fromContact,
        status: 'delivered',
        whatsappId,
        timestamp: timestamp ? new Date(timestamp) : new Date()
      }
    });

    // Atualizar conversa
    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        lastMessage: content.substring(0, 100),
        lastActivity: new Date(),
        status: 'open',
        unreadCount: fromContact ? { increment: 1 } : undefined
      }
    });

    res.json(message);
  } catch (error) {
    console.error('Erro ao receber mensagem:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Buscar uma mensagem específica
export const getMessage = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const message = await prisma.message.findUnique({
      where: { id: parseInt(id) },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        conversation: {
          select: {
            id: true,
            contact: {
              select: {
                id: true,
                name: true,
                phone: true
              }
            }
          }
        }
      }
    });

    if (!message) {
      return res.status(404).json({ error: 'Mensagem não encontrada' });
    }

    res.json(message);
  } catch (error) {
    console.error('Erro ao buscar mensagem:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};
