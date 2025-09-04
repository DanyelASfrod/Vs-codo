import express from 'express';
import {
  getConversations,
  getConversation,
  assignConversation,
  autoAssignConversation,
  updateConversationStatus,
  getConversationMetrics
} from '../controllers/conversationsController';

const router = express.Router();

// Rotas para conversas
router.get('/', getConversations);
router.get('/metrics', getConversationMetrics);
router.get('/:id', getConversation);
router.put('/:id/assign', assignConversation);
router.put('/:id/auto-assign', autoAssignConversation);
router.put('/:id/status', updateConversationStatus);

export default router;
