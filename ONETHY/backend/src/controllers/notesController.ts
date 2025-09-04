import { Response } from 'express'
import { db } from '../lib/db'
import { AuthRequest } from '../types'

// Listar notas de uma conversa
export const getConversationNotes = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id
    const { conversationId } = req.params

    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' })
    }

    // Verificar se a conversa pertence ao usuário
    const conversation = await db.conversation.findFirst({
      where: {
        id: Number(conversationId),
        userId
      }
    })

    if (!conversation) {
      return res.status(404).json({ error: 'Conversa não encontrada' })
    }

    const notes = await db.conversationNote.findMany({
      where: {
        conversationId: Number(conversationId)
      },
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
        createdAt: 'desc'
      }
    })

    res.json(notes)
  } catch (error) {
    console.error('Erro ao buscar notas:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
}

// Criar nova nota
export const createNote = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id
    const { conversationId } = req.params
    const { content, isPrivate = false } = req.body

    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' })
    }

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Conteúdo da nota é obrigatório' })
    }

    // Verificar se a conversa pertence ao usuário
    const conversation = await db.conversation.findFirst({
      where: {
        id: Number(conversationId),
        userId
      }
    })

    if (!conversation) {
      return res.status(404).json({ error: 'Conversa não encontrada' })
    }

    const note = await db.conversationNote.create({
      data: {
        conversationId: Number(conversationId),
        userId,
        content: content.trim(),
        isPrivate
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
    })

    res.status(201).json(note)
  } catch (error) {
    console.error('Erro ao criar nota:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
}

// Atualizar nota
export const updateNote = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id
    const { id } = req.params
    const { content, isPrivate } = req.body

    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' })
    }

    // Verificar se a nota existe e pertence ao usuário
    const existingNote = await db.conversationNote.findFirst({
      where: {
        id: Number(id),
        userId
      }
    })

    if (!existingNote) {
      return res.status(404).json({ error: 'Nota não encontrada ou não autorizada' })
    }

    if (content && content.trim().length === 0) {
      return res.status(400).json({ error: 'Conteúdo da nota não pode ser vazio' })
    }

    const updatedNote = await db.conversationNote.update({
      where: {
        id: Number(id)
      },
      data: {
        ...(content && { content: content.trim() }),
        ...(isPrivate !== undefined && { isPrivate }),
        updatedAt: new Date()
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
    })

    res.json(updatedNote)
  } catch (error) {
    console.error('Erro ao atualizar nota:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
}

// Deletar nota
export const deleteNote = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id
    const { id } = req.params

    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' })
    }

    // Verificar se a nota existe e pertence ao usuário
    const existingNote = await db.conversationNote.findFirst({
      where: {
        id: Number(id),
        userId
      }
    })

    if (!existingNote) {
      return res.status(404).json({ error: 'Nota não encontrada ou não autorizada' })
    }

    await db.conversationNote.delete({
      where: {
        id: Number(id)
      }
    })

    res.json({ success: true, message: 'Nota deletada com sucesso' })
  } catch (error) {
    console.error('Erro ao deletar nota:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
}

// Listar todas as macros do usuário
export const getMacros = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id

    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' })
    }

    const macros = await db.macro.findMany({
      where: {
        userId
      },
      orderBy: {
        name: 'asc'
      }
    })

    res.json(macros)
  } catch (error) {
    console.error('Erro ao buscar macros:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
}

// Criar nova macro
export const createMacro = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id
    const { name, content, shortcut } = req.body

    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' })
    }

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Nome da macro é obrigatório' })
    }

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Conteúdo da macro é obrigatório' })
    }

    // Verificar se já existe uma macro com o mesmo nome para este usuário
    const existingMacro = await db.macro.findFirst({
      where: {
        userId,
        name: name.trim()
      }
    })

    if (existingMacro) {
      return res.status(400).json({ error: 'Já existe uma macro com este nome' })
    }

    const macro = await db.macro.create({
      data: {
        userId,
        name: name.trim(),
        content: content.trim(),
        ...(shortcut && { shortcut: shortcut.trim() })
      }
    })

    res.status(201).json(macro)
  } catch (error) {
    console.error('Erro ao criar macro:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
}

// Atualizar macro
export const updateMacro = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id
    const { id } = req.params
    const { name, content, shortcut } = req.body

    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' })
    }

    // Verificar se a macro existe e pertence ao usuário
    const existingMacro = await db.macro.findFirst({
      where: {
        id: Number(id),
        userId
      }
    })

    if (!existingMacro) {
      return res.status(404).json({ error: 'Macro não encontrada ou não autorizada' })
    }

    if (name && name.trim().length === 0) {
      return res.status(400).json({ error: 'Nome da macro não pode ser vazio' })
    }

    if (content && content.trim().length === 0) {
      return res.status(400).json({ error: 'Conteúdo da macro não pode ser vazio' })
    }

    // Se está mudando o nome, verificar se não existe conflito
    if (name && name.trim() !== existingMacro.name) {
      const conflictMacro = await db.macro.findFirst({
        where: {
          userId,
          name: name.trim(),
          id: { not: Number(id) }
        }
      })

      if (conflictMacro) {
        return res.status(400).json({ error: 'Já existe uma macro com este nome' })
      }
    }

    const updatedMacro = await db.macro.update({
      where: {
        id: Number(id)
      },
      data: {
        ...(name && { name: name.trim() }),
        ...(content && { content: content.trim() }),
        ...(shortcut !== undefined && { shortcut: shortcut?.trim() || null }),
        updatedAt: new Date()
      }
    })

    res.json(updatedMacro)
  } catch (error) {
    console.error('Erro ao atualizar macro:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
}

// Deletar macro
export const deleteMacro = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id
    const { id } = req.params

    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' })
    }

    // Verificar se a macro existe e pertence ao usuário
    const existingMacro = await db.macro.findFirst({
      where: {
        id: Number(id),
        userId
      }
    })

    if (!existingMacro) {
      return res.status(404).json({ error: 'Macro não encontrada ou não autorizada' })
    }

    await db.macro.delete({
      where: {
        id: Number(id)
      }
    })

    res.json({ success: true, message: 'Macro deletada com sucesso' })
  } catch (error) {
    console.error('Erro ao deletar macro:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
}

// Aplicar macro em uma conversa (enviar como mensagem)
export const applyMacro = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id
    const { conversationId, macroId } = req.params

    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' })
    }

    // Verificar se a conversa pertence ao usuário
    const conversation = await db.conversation.findFirst({
      where: {
        id: Number(conversationId),
        userId
      }
    })

    if (!conversation) {
      return res.status(404).json({ error: 'Conversa não encontrada' })
    }

    // Buscar a macro
    const macro = await db.macro.findFirst({
      where: {
        id: Number(macroId),
        userId
      }
    })

    if (!macro) {
      return res.status(404).json({ error: 'Macro não encontrada' })
    }

    // Criar a mensagem com o conteúdo da macro
    const message = await db.message.create({
      data: {
        userId,
        conversationId: Number(conversationId),
        content: macro.content,
        type: 'text',
        fromMe: true,
        status: 'sent'
      }
    })

    // Atualizar a conversa com a última mensagem
    await db.conversation.update({
      where: {
        id: Number(conversationId)
      },
      data: {
        lastMessage: macro.content,
        lastActivity: new Date(),
        updatedAt: new Date()
      }
    })

    res.json({
      success: true,
      message,
      macro: {
        id: macro.id,
        name: macro.name
      }
    })
  } catch (error) {
    console.error('Erro ao aplicar macro:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
}
