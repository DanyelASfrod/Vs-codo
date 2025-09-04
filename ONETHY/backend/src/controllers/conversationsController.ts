import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../types';

const prisma = new PrismaClient();

// Listar conversas com filtros avançados
export const getConversations = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const { 
      status, 
      assignedTo, 
      teamId, 
      channel, 
      priority,
      page = 1, 
      limit = 20,
      search 
    } = req.query;

    const where: any = {};

    if (status) where.status = status;
    if (assignedTo) where.assignedToId = assignedTo;
    if (teamId) where.teamId = teamId;
    if (channel) where.channel = channel;
    if (priority) where.priority = priority;
    if (search) {
      where.OR = [
        { contact: { name: { contains: search, mode: 'insensitive' } } },
        { contact: { phone: { contains: search, mode: 'insensitive' } } },
        { messages: { some: { content: { contains: search, mode: 'insensitive' } } } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [conversations, total] = await Promise.all([
      prisma.conversation.findMany({
        where,
        skip,
        take: Number(limit),
        include: {
          contact: {
            select: {
              id: true,
              name: true,
              phone: true,
              email: true,
            },
          },
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
              status: true
            }
          },
          team: {
            select: {
              id: true,
              name: true,
              color: true
            }
          },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: {
              id: true,
              content: true,
              type: true,
              createdAt: true,
              isFromBot: true
            }
          },
          labels: {
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
            },
          },
        },
        orderBy: [
          { priority: 'desc' },
          { updatedAt: 'desc' }
        ]
      }),
      prisma.conversation.count({ where })
    ]);

    res.json({
      conversations,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error getting conversations:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

export const getConversation = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const conversation = await prisma.conversation.findUnique({
      where: { id: parseInt(id) },
      include: {
        contact: true,
        assignedAgent: {
          select: {
            id: true,
            name: true,
            email: true,
            status: true
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
          orderBy: { createdAt: 'asc' },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        notes: {
          orderBy: { createdAt: 'desc' },
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
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversa não encontrada' });
    }

    res.json(conversation);
  } catch (error) {
    console.error('Erro ao buscar conversa:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Atribuir conversa a um agente
export const assignConversation = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { userId: assignToUserId, teamId } = req.body;

    const conversation = await prisma.conversation.update({
      where: { id: parseInt(id) },
      data: {
        assignedAgentId: assignToUserId,
        assignedTeamId: teamId,
        status: 'open'
      },
      include: {
        assignedAgent: {
          select: {
            id: true,
            name: true,
            email: true,
            status: true
          }
        },
        assignedTeam: {
          select: {
            id: true,
            name: true,
            color: true
          }
        },
        contact: true
      }
    });

    res.json(conversation);
  } catch (error) {
    console.error('Erro ao atribuir conversa:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Round-robin para atribuição automática
export const autoAssignConversation = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { teamId } = req.body;

    // Buscar agentes disponíveis da equipe
    const availableAgents = await prisma.user.findMany({
      where: {
        teamId: teamId,
        status: 'online'
      },
      include: {
        _count: {
          select: {
            assignedConversations: {
              where: {
                status: {
                  in: ['open', 'pending']
                }
              }
            }
          }
        }
      }
    });

    if (availableAgents.length === 0) {
      return res.status(400).json({ error: 'Nenhum agente disponível na equipe' });
    }

    // Encontrar agente com menor número de conversas ativas (round-robin)
    const agentWithLeastConversations = availableAgents.reduce((min, agent) => 
      agent._count.assignedConversations < min._count.assignedConversations ? agent : min
    );

    const conversation = await prisma.conversation.update({
      where: { id: parseInt(id) },
      data: {
        assignedAgentId: agentWithLeastConversations.id,
        assignedTeamId: teamId,
        status: 'open'
      },
      include: {
        assignedAgent: {
          select: {
            id: true,
            name: true,
            email: true,
            status: true
          }
        },
        assignedTeam: {
          select: {
            id: true,
            name: true,
            color: true
          }
        },
        contact: true
      }
    });

    res.json(conversation);
  } catch (error) {
    console.error('Erro na atribuição automática:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Atualizar status da conversa
export const updateConversationStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, priority } = req.body;

    const conversation = await prisma.conversation.update({
      where: { id: parseInt(id) },
      data: {
        ...(status && { status }),
        ...(priority && { priority }),
        updatedAt: new Date()
      },
      include: {
        assignedAgent: {
          select: {
            id: true,
            name: true,
            email: true,
            status: true
          }
        },
        assignedTeam: {
          select: {
            id: true,
            name: true,
            color: true
          }
        },
        contact: true
      }
    });

    res.json(conversation);
  } catch (error) {
    console.error('Erro ao atualizar conversa:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Buscar métricas de SLA
export const getConversationMetrics = async (req: AuthRequest, res: Response) => {
  try {
    const { teamId, userId: targetUserId, startDate, endDate } = req.query;

    const where: any = {};
    if (teamId) where.assignedTeamId = parseInt(teamId as string);
    if (targetUserId) where.assignedAgentId = parseInt(targetUserId as string);
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate as string);
      if (endDate) where.createdAt.lte = new Date(endDate as string);
    }

    const [total, active, pending, closed] = await Promise.all([
      prisma.conversation.count({ where }),
      prisma.conversation.count({ where: { ...where, status: 'open' } }),
      prisma.conversation.count({ where: { ...where, status: 'pending' } }),
      prisma.conversation.count({ where: { ...where, status: 'closed' } })
    ]);

    res.json({
      total,
      active,
      pending,
      closed
    });
  } catch (error) {
    console.error('Erro ao buscar métricas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};
