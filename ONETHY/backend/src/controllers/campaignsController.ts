import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../types';

const prisma = new PrismaClient();

export const getCampaigns = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const campaigns = await prisma.campaign.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ campaigns });
  } catch (error) {
    console.error('Error getting campaigns:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

export const createCampaign = async (req: AuthRequest, res: Response) => {
  try {
    const { name, status, scheduledAt } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    if (!name) {
      return res.status(400).json({ error: 'Nome da campanha é obrigatório' });
    }

    const campaign = await prisma.campaign.create({
      data: {
        userId,
        name,
        status: status || 'draft',
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      },
    });

    res.status(201).json(campaign);
  } catch (error) {
    console.error('Error creating campaign:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

export const updateCampaign = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, status, totalMessages, sentMessages, deliveryRate, openRate, scheduledAt } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const campaign = await prisma.campaign.findFirst({
      where: { id: parseInt(id), userId },
    });

    if (!campaign) {
      return res.status(404).json({ error: 'Campanha não encontrada' });
    }

    const updatedCampaign = await prisma.campaign.update({
      where: { id: parseInt(id) },
      data: {
        name: name || campaign.name,
        status: status || campaign.status,
        totalMessages: totalMessages !== undefined ? totalMessages : campaign.totalMessages,
        sentMessages: sentMessages !== undefined ? sentMessages : campaign.sentMessages,
        deliveryRate: deliveryRate !== undefined ? deliveryRate : campaign.deliveryRate,
        openRate: openRate !== undefined ? openRate : campaign.openRate,
        scheduledAt: scheduledAt !== undefined ? (scheduledAt ? new Date(scheduledAt) : null) : campaign.scheduledAt,
        updatedAt: new Date(),
      },
    });

    res.json(updatedCampaign);
  } catch (error) {
    console.error('Error updating campaign:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

export const deleteCampaign = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const campaign = await prisma.campaign.findFirst({
      where: { id: parseInt(id), userId },
    });

    if (!campaign) {
      return res.status(404).json({ error: 'Campanha não encontrada' });
    }

    await prisma.campaign.delete({
      where: { id: parseInt(id) },
    });

    res.json({ message: 'Campanha removida com sucesso' });
  } catch (error) {
    console.error('Error deleting campaign:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};
