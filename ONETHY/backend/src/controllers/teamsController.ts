import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../types';

const prisma = new PrismaClient();

// Listar todas as equipes
export const getTeams = async (req: AuthRequest, res: Response) => {
  try {
    const teams = await prisma.team.findMany({
      include: {
        members: {
          select: {
            id: true,
            name: true,
            email: true,
            status: true
          }
        },
        _count: {
          select: {
            members: true,
            conversations: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    res.json(teams);
  } catch (error) {
    console.error('Erro ao buscar equipes:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Buscar uma equipe específica
export const getTeam = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const team = await prisma.team.findUnique({
      where: { id: parseInt(id) },
      include: {
        members: {
          select: {
            id: true,
            name: true,
            email: true,
            status: true
          }
        },
        conversations: {
          include: {
            contact: {
              select: {
                id: true,
                name: true,
                phone: true
              }
            }
          },
          orderBy: {
            updatedAt: 'desc'
          },
          take: 10 // Últimas 10 conversas
        },
        _count: {
          select: {
            members: true,
            conversations: true
          }
        }
      }
    });

    if (!team) {
      return res.status(404).json({ error: 'Equipe não encontrada' });
    }

    res.json(team);
  } catch (error) {
    console.error('Erro ao buscar equipe:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Criar nova equipe
export const createTeam = async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, color } = req.body;

    const team = await prisma.team.create({
      data: {
        name,
        description,
        color
      },
      include: {
        _count: {
          select: {
            members: true,
            conversations: true
          }
        }
      }
    });

    res.status(201).json(team);
  } catch (error) {
    console.error('Erro ao criar equipe:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Atualizar equipe
export const updateTeam = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, color } = req.body;

    const team = await prisma.team.update({
      where: { id: parseInt(id) },
      data: {
        ...(name && { name }),
        ...(description && { description }),
        ...(color && { color })
      },
      include: {
        members: {
          select: {
            id: true,
            name: true,
            email: true,
            status: true
          }
        },
        _count: {
          select: {
            members: true,
            conversations: true
          }
        }
      }
    });

    res.json(team);
  } catch (error) {
    console.error('Erro ao atualizar equipe:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Deletar equipe
export const deleteTeam = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Verificar se a equipe tem conversas ativas
    const activeConversations = await prisma.conversation.count({
      where: {
        assignedTeamId: parseInt(id),
        status: { in: ['open', 'pending'] }
      }
    });

    if (activeConversations > 0) {
      return res.status(400).json({ 
        error: `Não é possível deletar a equipe. Existem ${activeConversations} conversa(s) ativa(s) atribuída(s) a esta equipe.` 
      });
    }

    await prisma.team.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Equipe deletada com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar equipe:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Adicionar membro à equipe
export const addTeamMember = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    // Verificar se o usuário existe
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Verificar se o usuário já está na equipe
    if (user.teamId === parseInt(id)) {
      return res.status(400).json({ error: 'Usuário já é membro desta equipe' });
    }

    // Adicionar usuário à equipe
    await prisma.user.update({
      where: { id: userId },
      data: { teamId: parseInt(id) }
    });

    const updatedTeam = await prisma.team.findUnique({
      where: { id: parseInt(id) },
      include: {
        members: {
          select: {
            id: true,
            name: true,
            email: true,
            status: true
          }
        }
      }
    });

    res.json(updatedTeam);
  } catch (error) {
    console.error('Erro ao adicionar membro à equipe:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Remover membro da equipe
export const removeTeamMember = async (req: AuthRequest, res: Response) => {
  try {
    const { id, userId } = req.params;

    // Verificar se o usuário está na equipe
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) }
    });

    if (!user || user.teamId !== parseInt(id)) {
      return res.status(404).json({ error: 'Usuário não é membro desta equipe' });
    }

    // Verificar se o usuário tem conversas ativas atribuídas
    const activeConversations = await prisma.conversation.count({
      where: {
        assignedAgentId: parseInt(userId),
        status: { in: ['open', 'pending'] }
      }
    });

    if (activeConversations > 0) {
      return res.status(400).json({ 
        error: `Não é possível remover o usuário. Existem ${activeConversations} conversa(s) ativa(s) atribuída(s) a ele.` 
      });
    }

    // Remover usuário da equipe
    await prisma.user.update({
      where: { id: parseInt(userId) },
      data: { teamId: null }
    });

    const updatedTeam = await prisma.team.findUnique({
      where: { id: parseInt(id) },
      include: {
        members: {
          select: {
            id: true,
            name: true,
            email: true,
            status: true
          }
        }
      }
    });

    res.json(updatedTeam);
  } catch (error) {
    console.error('Erro ao remover membro da equipe:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Métricas da equipe
export const getTeamMetrics = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;

    const where: any = { assignedTeamId: parseInt(id) };
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate as string);
      if (endDate) where.createdAt.lte = new Date(endDate as string);
    }

    const [
      totalConversations,
      activeConversations,
      closedConversations,
      totalMessages,
      avgResponseTime,
      membersCount
    ] = await Promise.all([
      prisma.conversation.count({ where }),
      prisma.conversation.count({ where: { ...where, status: 'open' } }),
      prisma.conversation.count({ where: { ...where, status: 'closed' } }),
      prisma.message.count({ 
        where: { 
          conversation: { assignedTeamId: parseInt(id) },
          ...(startDate || endDate ? { createdAt: where.createdAt } : {})
        } 
      }),
      // Calcular tempo médio de resposta seria mais complexo, por agora retornando 0
      Promise.resolve(0),
      prisma.user.count({ where: { teamId: parseInt(id) } })
    ]);

    res.json({
      totalConversations,
      activeConversations,
      closedConversations,
      totalMessages,
      avgResponseTime,
      membersCount,
      resolutionRate: totalConversations > 0 ? (closedConversations / totalConversations * 100) : 0
    });
  } catch (error) {
    console.error('Erro ao buscar métricas da equipe:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};
