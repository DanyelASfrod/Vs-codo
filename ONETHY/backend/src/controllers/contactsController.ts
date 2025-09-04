import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../types';

const prisma = new PrismaClient();

export const getContacts = async (req: AuthRequest, res: Response) => {
  try {
    const { search, status, tags, limit = '50', offset = '0' } = req.query;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const where: any = {
      userId,
    };

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { phone: { contains: search as string } },
        { email: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (tags && Array.isArray(tags)) {
      where.tags = {
        hasSome: tags as string[],
      };
    }

    const contacts = await prisma.contact.findMany({
      where,
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
      orderBy: { createdAt: 'desc' },
    });

    const total = await prisma.contact.count({ where });

    res.json({
      contacts,
      total,
      hasMore: total > parseInt(offset as string) + parseInt(limit as string),
    });
  } catch (error) {
    console.error('Error getting contacts:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

export const createContact = async (req: AuthRequest, res: Response) => {
  try {
    const { name, phone, email, company, tags, source } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    if (!name || !phone) {
      return res.status(400).json({ error: 'Nome e telefone são obrigatórios' });
    }

    const contact = await prisma.contact.create({
      data: {
        userId,
        name,
        phone,
        email: email || null,
        company: company || null,
        tags: tags || [],
        source: source || 'manual',
      },
    });

    res.status(201).json(contact);
  } catch (error) {
    console.error('Error creating contact:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

export const updateContact = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, phone, email, company, tags, status } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const contact = await prisma.contact.findFirst({
      where: { id: parseInt(id), userId },
    });

    if (!contact) {
      return res.status(404).json({ error: 'Contato não encontrado' });
    }

    const updatedContact = await prisma.contact.update({
      where: { id: parseInt(id) },
      data: {
        name: name || contact.name,
        phone: phone || contact.phone,
        email: email !== undefined ? email : contact.email,
        company: company !== undefined ? company : contact.company,
        tags: tags !== undefined ? tags : contact.tags,
        status: status || contact.status,
        updatedAt: new Date(),
      },
    });

    res.json(updatedContact);
  } catch (error) {
    console.error('Error updating contact:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

export const deleteContact = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const contact = await prisma.contact.findFirst({
      where: { id: parseInt(id), userId },
    });

    if (!contact) {
      return res.status(404).json({ error: 'Contato não encontrado' });
    }

    await prisma.contact.delete({
      where: { id: parseInt(id) },
    });

    res.json({ message: 'Contato removido com sucesso' });
  } catch (error) {
    console.error('Error deleting contact:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};
