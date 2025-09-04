import { Router } from 'express'
import {
  getChannels,
  createChannel,
  updateChannel,
  deleteChannel,
  createWhatsAppInstance,
  connectWhatsAppInstance,
  restartWhatsAppInstance,
  logoutWhatsAppInstance,
  syncInstances
} from '../controllers/channelsController'

const router = Router()

// Rotas básicas de canais
router.get('/', getChannels)
router.post('/', createChannel)
router.put('/:id', updateChannel)
router.delete('/:id', deleteChannel)

// Rotas específicas para WhatsApp/Evolution API
router.post('/whatsapp/create', createWhatsAppInstance)
router.get('/whatsapp/connect/:instanceName', connectWhatsAppInstance)
router.post('/whatsapp/restart/:instanceName', restartWhatsAppInstance)
router.delete('/whatsapp/logout/:instanceName', logoutWhatsAppInstance)
router.post('/sync', syncInstances)

export default router
