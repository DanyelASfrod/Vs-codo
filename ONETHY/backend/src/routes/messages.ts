import express from 'express';
import {
  getMessages,
  sendMessage,
  markAsRead,
  receiveMessage,
  getMessage
} from '../controllers/messagesController';

const router = express.Router();

// Rotas para mensagens
router.get('/conversation/:conversationId', getMessages);
router.post('/conversation/:conversationId', sendMessage);
router.put('/conversation/:conversationId/read', markAsRead);
router.get('/:id', getMessage);

// Rota para receber mensagens externas (webhooks)
router.post('/receive', receiveMessage);

export default router;
