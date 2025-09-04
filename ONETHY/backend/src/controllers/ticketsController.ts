import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../types';

const prisma = new PrismaClient();

export const getTickets = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const tickets = await prisma.supportTicket.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ tickets });
  } catch (error) {
    console.error('Error getting tickets:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

export const createTicket = async (req: AuthRequest, res: Response) => {
  try {
    const { subject, description, priority, category } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    if (!subject || !description) {
      return res.status(400).json({ error: 'Assunto e descrição são obrigatórios' });
    }

    const ticket = await prisma.supportTicket.create({
      data: {
        userId,
        subject,
        description,
        priority: priority || 'medium',
        category: category || 'other',
      },
    });

    res.status(201).json(ticket);
  } catch (error) {
    console.error('Error creating ticket:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

export const updateTicket = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, priority } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const ticket = await prisma.supportTicket.findFirst({
      where: { id: parseInt(id), userId },
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket não encontrado' });
    }

    const updatedTicket = await prisma.supportTicket.update({
      where: { id: parseInt(id) },
      data: {
        status: status || ticket.status,
        priority: priority || ticket.priority,
        updatedAt: new Date(),
      },
    });

    res.json(updatedTicket);
  } catch (error) {
    console.error('Error updating ticket:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};
