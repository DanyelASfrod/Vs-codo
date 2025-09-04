import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../types';

const prisma = new PrismaClient();

// Listar todas as macros do usuário
export const getMacros = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const { category, search, isActive } = req.query;

    const where: any = { userId };

    if (category) where.category = category;
    if (isActive !== undefined) where.isActive = isActive === 'true';
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
        { shortcut: { contains: search, mode: 'insensitive' } }
      ];
    }

    const macros = await prisma.macro.findMany({
      where,
      orderBy: [
        { useCount: 'desc' },
        { name: 'asc' }
      ]
    });

    res.json(macros);
  } catch (error) {
    console.error('Erro ao buscar macros:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Buscar uma macro específica
export const getMacro = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const macro = await prisma.macro.findUnique({
      where: { id: parseInt(id) }
    });

    if (!macro || macro.userId !== userId) {
      return res.status(404).json({ error: 'Macro não encontrada' });
    }

    res.json(macro);
  } catch (error) {
    console.error('Erro ao buscar macro:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Criar nova macro
export const createMacro = async (req: AuthRequest, res: Response) => {
  try {
    const { name, content, shortcut, category } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    // Verificar se já existe uma macro com o mesmo atalho
    if (shortcut) {
      const existingMacro = await prisma.macro.findFirst({
        where: {
          userId,
          shortcut,
          isActive: true
        }
      });

      if (existingMacro) {
        return res.status(400).json({ error: 'Já existe uma macro com este atalho' });
      }
    }

    const macro = await prisma.macro.create({
      data: {
        userId,
        name,
        content,
        shortcut,
        category
      }
    });

    res.status(201).json(macro);
  } catch (error) {
    console.error('Erro ao criar macro:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Atualizar macro
export const updateMacro = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, content, shortcut, category, isActive } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    // Verificar se a macro existe e pertence ao usuário
    const existingMacro = await prisma.macro.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingMacro || existingMacro.userId !== userId) {
      return res.status(404).json({ error: 'Macro não encontrada' });
    }

    // Verificar se o novo atalho já está em uso por outra macro
    if (shortcut && shortcut !== existingMacro.shortcut) {
      const duplicateMacro = await prisma.macro.findFirst({
        where: {
          userId,
          shortcut,
          isActive: true,
          id: { not: parseInt(id) }
        }
      });

      if (duplicateMacro) {
        return res.status(400).json({ error: 'Já existe uma macro com este atalho' });
      }
    }

    const macro = await prisma.macro.update({
      where: { id: parseInt(id) },
      data: {
        ...(name && { name }),
        ...(content && { content }),
        ...(shortcut !== undefined && { shortcut }),
        ...(category && { category }),
        ...(isActive !== undefined && { isActive })
      }
    });

    res.json(macro);
  } catch (error) {
    console.error('Erro ao atualizar macro:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Deletar macro
export const deleteMacro = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    // Verificar se a macro existe e pertence ao usuário
    const macro = await prisma.macro.findUnique({
      where: { id: parseInt(id) }
    });

    if (!macro || macro.userId !== userId) {
      return res.status(404).json({ error: 'Macro não encontrada' });
    }

    await prisma.macro.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Macro deletada com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar macro:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Usar macro (incrementa contador de uso)
export const useMacro = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const macro = await prisma.macro.findUnique({
      where: { id: parseInt(id) }
    });

    if (!macro || macro.userId !== userId) {
      return res.status(404).json({ error: 'Macro não encontrada' });
    }

    if (!macro.isActive) {
      return res.status(400).json({ error: 'Macro está inativa' });
    }

    // Incrementar contador de uso
    const updatedMacro = await prisma.macro.update({
      where: { id: parseInt(id) },
      data: {
        useCount: { increment: 1 }
      }
    });

    res.json({
      content: updatedMacro.content,
      useCount: updatedMacro.useCount
    });
  } catch (error) {
    console.error('Erro ao usar macro:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Buscar macro por atalho
export const getMacroByShortcut = async (req: AuthRequest, res: Response) => {
  try {
    const { shortcut } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const macro = await prisma.macro.findFirst({
      where: {
        userId,
        shortcut,
        isActive: true
      }
    });

    if (!macro) {
      return res.status(404).json({ error: 'Macro não encontrada' });
    }

    // Incrementar contador de uso
    await prisma.macro.update({
      where: { id: macro.id },
      data: {
        useCount: { increment: 1 }
      }
    });

    res.json({
      id: macro.id,
      content: macro.content,
      name: macro.name
    });
  } catch (error) {
    console.error('Erro ao buscar macro por atalho:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Listar categorias de macros
export const getMacroCategories = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const categories = await prisma.macro.groupBy({
      by: ['category'],
      where: {
        userId,
        isActive: true,
        category: { not: null }
      },
      _count: {
        category: true
      },
      orderBy: {
        category: 'asc'
      }
    });

    const formattedCategories = categories.map(cat => ({
      name: cat.category,
      count: cat._count.category
    }));

    res.json(formattedCategories);
  } catch (error) {
    console.error('Erro ao buscar categorias:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};
