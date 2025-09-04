import { Response } from 'express'
import { db } from '../lib/db'
import { AuthRequest } from '../types'

// Listar todos os contatos do usuário
export const getContacts = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id
    const { 
      search, 
      page = 1, 
      limit = 20 
    } = req.query

    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' })
    }

    const skip = (Number(page) - 1) * Number(limit)

    const whereClause: any = {
      userId,
      ...(search && {
        OR: [
          { name: { contains: search as string, mode: 'insensitive' } },
          { phone: { contains: search as string } },
          { email: { contains: search as string, mode: 'insensitive' } }
        ]
      })
    }

    const contacts = await db.contact.findMany({
      where: whereClause,
      include: {
        attributes: true,
        _count: {
          select: {
            conversations: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      },
      skip,
      take: Number(limit)
    })

    const total = await db.contact.count({ where: whereClause })

    res.json({
      contacts,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    })
  } catch (error) {
    console.error('Erro ao buscar contatos:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
}

// Buscar um contato específico
export const getContact = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id
    const { id } = req.params

    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' })
    }

    const contact = await db.contact.findFirst({
      where: {
        id: Number(id),
        userId
      },
      include: {
        attributes: {
          orderBy: {
            name: 'asc'
          }
        },
        conversations: {
          include: {
            channel: {
              select: {
                id: true,
                name: true,
                type: true
              }
            }
          },
          orderBy: {
            lastActivity: 'desc'
          },
          take: 10 // Últimas 10 conversas
        }
      }
    })

    if (!contact) {
      return res.status(404).json({ error: 'Contato não encontrado' })
    }

    res.json(contact)
  } catch (error) {
    console.error('Erro ao buscar contato:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
}

// Criar novo contato
export const createContact = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id
    const { 
      name, 
      phone, 
      email, 
      avatar, 
      notes,
      attributes = []
    } = req.body

    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' })
    }

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Nome é obrigatório' })
    }

    if (!phone || phone.trim().length === 0) {
      return res.status(400).json({ error: 'Telefone é obrigatório' })
    }

    // Verificar se já existe um contato com este telefone para este usuário
    const existingContact = await db.contact.findFirst({
      where: {
        userId,
        phone: phone.trim()
      }
    })

    if (existingContact) {
      return res.status(400).json({ error: 'Já existe um contato com este telefone' })
    }

    // Criar o contato
    const contact = await db.contact.create({
      data: {
        userId,
        name: name.trim(),
        phone: phone.trim(),
        ...(email && { email: email.trim() }),
        ...(avatar && { avatar }),
        ...(notes && { notes })
      }
    })

    // Criar atributos se fornecidos
    if (attributes.length > 0) {
      const contactAttributes = attributes.map((attr: any) => ({
        contactId: contact.id,
        name: attr.name.trim(),
        value: attr.value.trim(),
        type: attr.type || 'text'
      }))

      await db.contactAttribute.createMany({
        data: contactAttributes
      })
    }

    // Buscar o contato criado com atributos
    const createdContact = await db.contact.findFirst({
      where: {
        id: contact.id
      },
      include: {
        attributes: true
      }
    })

    res.status(201).json(createdContact)
  } catch (error) {
    console.error('Erro ao criar contato:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
}

// Atualizar contato
export const updateContact = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id
    const { id } = req.params
    const { 
      name, 
      phone, 
      email, 
      avatar, 
      notes 
    } = req.body

    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' })
    }

    // Verificar se o contato existe e pertence ao usuário
    const existingContact = await db.contact.findFirst({
      where: {
        id: Number(id),
        userId
      }
    })

    if (!existingContact) {
      return res.status(404).json({ error: 'Contato não encontrado ou não autorizado' })
    }

    if (name && name.trim().length === 0) {
      return res.status(400).json({ error: 'Nome não pode ser vazio' })
    }

    if (phone && phone.trim().length === 0) {
      return res.status(400).json({ error: 'Telefone não pode ser vazio' })
    }

    // Se está mudando o telefone, verificar se não existe conflito
    if (phone && phone.trim() !== existingContact.phone) {
      const conflictContact = await db.contact.findFirst({
        where: {
          userId,
          phone: phone.trim(),
          id: { not: Number(id) }
        }
      })

      if (conflictContact) {
        return res.status(400).json({ error: 'Já existe um contato com este telefone' })
      }
    }

    const updatedContact = await db.contact.update({
      where: {
        id: Number(id)
      },
      data: {
        ...(name && { name: name.trim() }),
        ...(phone && { phone: phone.trim() }),
        ...(email !== undefined && { email: email?.trim() || null }),
        ...(avatar !== undefined && { avatar }),
        ...(notes !== undefined && { notes }),
        updatedAt: new Date()
      },
      include: {
        attributes: true
      }
    })

    res.json(updatedContact)
  } catch (error) {
    console.error('Erro ao atualizar contato:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
}

// Deletar contato
export const deleteContact = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id
    const { id } = req.params

    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' })
    }

    // Verificar se o contato existe e pertence ao usuário
    const existingContact = await db.contact.findFirst({
      where: {
        id: Number(id),
        userId
      }
    })

    if (!existingContact) {
      return res.status(404).json({ error: 'Contato não encontrado ou não autorizado' })
    }

    // Verificar se o contato tem conversas ativas
    const activeConversations = await db.conversation.count({
      where: {
        contactId: Number(id),
        status: { not: 'closed' }
      }
    })

    if (activeConversations > 0) {
      return res.status(400).json({ 
        error: 'Não é possível deletar contato com conversas ativas. Feche as conversas primeiro.' 
      })
    }

    await db.contact.delete({
      where: {
        id: Number(id)
      }
    })

    res.json({ success: true, message: 'Contato deletado com sucesso' })
  } catch (error) {
    console.error('Erro ao deletar contato:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
}

// Listar atributos de um contato
export const getContactAttributes = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id
    const { contactId } = req.params

    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' })
    }

    // Verificar se o contato pertence ao usuário
    const contact = await db.contact.findFirst({
      where: {
        id: Number(contactId),
        userId
      }
    })

    if (!contact) {
      return res.status(404).json({ error: 'Contato não encontrado' })
    }

    const attributes = await db.contactAttribute.findMany({
      where: {
        contactId: Number(contactId)
      },
      orderBy: {
        name: 'asc'
      }
    })

    res.json(attributes)
  } catch (error) {
    console.error('Erro ao buscar atributos do contato:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
}

// Criar atributo para contato
export const createContactAttribute = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id
    const { contactId } = req.params
    const { name, value, type = 'text' } = req.body

    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' })
    }

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Nome do atributo é obrigatório' })
    }

    if (!value || value.trim().length === 0) {
      return res.status(400).json({ error: 'Valor do atributo é obrigatório' })
    }

    // Verificar se o contato pertence ao usuário
    const contact = await db.contact.findFirst({
      where: {
        id: Number(contactId),
        userId
      }
    })

    if (!contact) {
      return res.status(404).json({ error: 'Contato não encontrado' })
    }

    // Verificar se já existe um atributo com o mesmo nome para este contato
    const existingAttribute = await db.contactAttribute.findFirst({
      where: {
        contactId: Number(contactId),
        name: name.trim()
      }
    })

    if (existingAttribute) {
      return res.status(400).json({ error: 'Já existe um atributo com este nome para este contato' })
    }

    const attribute = await db.contactAttribute.create({
      data: {
        contactId: Number(contactId),
        name: name.trim(),
        value: value.trim(),
        type
      }
    })

    res.status(201).json(attribute)
  } catch (error) {
    console.error('Erro ao criar atributo:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
}

// Atualizar atributo do contato
export const updateContactAttribute = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id
    const { id } = req.params
    const { name, value, type } = req.body

    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' })
    }

    // Verificar se o atributo existe e o contato pertence ao usuário
    const existingAttribute = await db.contactAttribute.findFirst({
      where: {
        id: Number(id),
        contact: {
          userId
        }
      },
      include: {
        contact: true
      }
    })

    if (!existingAttribute) {
      return res.status(404).json({ error: 'Atributo não encontrado ou não autorizado' })
    }

    if (name && name.trim().length === 0) {
      return res.status(400).json({ error: 'Nome do atributo não pode ser vazio' })
    }

    if (value && value.trim().length === 0) {
      return res.status(400).json({ error: 'Valor do atributo não pode ser vazio' })
    }

    // Se está mudando o nome, verificar se não existe conflito
    if (name && name.trim() !== existingAttribute.name) {
      const conflictAttribute = await db.contactAttribute.findFirst({
        where: {
          contactId: existingAttribute.contactId,
          name: name.trim(),
          id: { not: Number(id) }
        }
      })

      if (conflictAttribute) {
        return res.status(400).json({ error: 'Já existe um atributo com este nome para este contato' })
      }
    }

    const updatedAttribute = await db.contactAttribute.update({
      where: {
        id: Number(id)
      },
      data: {
        ...(name && { name: name.trim() }),
        ...(value && { value: value.trim() }),
        ...(type && { type }),
        updatedAt: new Date()
      }
    })

    res.json(updatedAttribute)
  } catch (error) {
    console.error('Erro ao atualizar atributo:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
}

// Deletar atributo do contato
export const deleteContactAttribute = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id
    const { id } = req.params

    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' })
    }

    // Verificar se o atributo existe e o contato pertence ao usuário
    const existingAttribute = await db.contactAttribute.findFirst({
      where: {
        id: Number(id),
        contact: {
          userId
        }
      }
    })

    if (!existingAttribute) {
      return res.status(404).json({ error: 'Atributo não encontrado ou não autorizado' })
    }

    await db.contactAttribute.delete({
      where: {
        id: Number(id)
      }
    })

    res.json({ success: true, message: 'Atributo deletado com sucesso' })
  } catch (error) {
    console.error('Erro ao deletar atributo:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
}
