import express from 'express'
import { 
  getConversations,
  getConversation,
  updateConversation,
  assignToMe,
  getMessages,
  sendMessage,
  markAsRead
} from '../controllers/inboxController'

import {
  getConversationNotes,
  createNote,
  updateNote,
  deleteNote,
  getMacros,
  createMacro,
  updateMacro,
  deleteMacro,
  applyMacro
} from '../controllers/notesController'

import {
  getContacts,
  getContact,
  createContact,
  updateContact,
  deleteContact,
  getContactAttributes,
  createContactAttribute,
  updateContactAttribute,
  deleteContactAttribute
} from '../controllers/contactsControllerNew'

const router = express.Router()

// ====== ROTAS DE CONVERSAS ======
// GET /api/inbox/conversations - Listar conversas
router.get('/conversations', getConversations)

// GET /api/inbox/conversations/:id - Buscar conversa específica
router.get('/conversations/:id', getConversation)

// PUT /api/inbox/conversations/:id - Atualizar conversa
router.put('/conversations/:id', updateConversation)

// POST /api/inbox/conversations/:id/assign-to-me - Atribuir a mim
router.post('/conversations/:id/assign-to-me', assignToMe)

// GET /api/inbox/conversations/:id/messages - Buscar mensagens
router.get('/conversations/:id/messages', getMessages)

// POST /api/inbox/conversations/:id/messages - Enviar mensagem
router.post('/conversations/:id/messages', sendMessage)

// POST /api/inbox/conversations/:id/mark-as-read - Marcar como lida
router.post('/conversations/:id/mark-as-read', markAsRead)

// ====== ROTAS DE NOTAS ======
// GET /api/inbox/conversations/:conversationId/notes - Listar notas
router.get('/conversations/:conversationId/notes', getConversationNotes)

// POST /api/inbox/conversations/:conversationId/notes - Criar nota
router.post('/conversations/:conversationId/notes', createNote)

// PUT /api/inbox/notes/:id - Atualizar nota
router.put('/notes/:id', updateNote)

// DELETE /api/inbox/notes/:id - Deletar nota
router.delete('/notes/:id', deleteNote)

// ====== ROTAS DE MACROS ======
// GET /api/inbox/macros - Listar macros
router.get('/macros', getMacros)

// POST /api/inbox/macros - Criar macro
router.post('/macros', createMacro)

// PUT /api/inbox/macros/:id - Atualizar macro
router.put('/macros/:id', updateMacro)

// DELETE /api/inbox/macros/:id - Deletar macro
router.delete('/macros/:id', deleteMacro)

// POST /api/inbox/conversations/:conversationId/macros/:macroId/apply - Aplicar macro
router.post('/conversations/:conversationId/macros/:macroId/apply', applyMacro)

// ====== ROTAS DE CONTATOS ======
// GET /api/inbox/contacts - Listar contatos
router.get('/contacts', getContacts)

// POST /api/inbox/contacts - Criar contato
router.post('/contacts', createContact)

// GET /api/inbox/contacts/:id - Buscar contato
router.get('/contacts/:id', getContact)

// PUT /api/inbox/contacts/:id - Atualizar contato
router.put('/contacts/:id', updateContact)

// DELETE /api/inbox/contacts/:id - Deletar contato
router.delete('/contacts/:id', deleteContact)

// ====== ROTAS DE ATRIBUTOS DE CONTATOS ======
// GET /api/inbox/contacts/:contactId/attributes - Listar atributos
router.get('/contacts/:contactId/attributes', getContactAttributes)

// POST /api/inbox/contacts/:contactId/attributes - Criar atributo
router.post('/contacts/:contactId/attributes', createContactAttribute)

// PUT /api/inbox/attributes/:id - Atualizar atributo
router.put('/attributes/:id', updateContactAttribute)

// DELETE /api/inbox/attributes/:id - Deletar atributo
router.delete('/attributes/:id', deleteContactAttribute)

export default router
