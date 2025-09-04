import { Router } from 'express'
import { receiveWebhook } from '../controllers/webhookController'

const router = Router()

// Rota para receber webhooks das instâncias WhatsApp
router.post('/webhook/:webhook', receiveWebhook)

export default router
