import express from 'express';
import {
  getMacros,
  getMacro,
  createMacro,
  updateMacro,
  deleteMacro,
  useMacro,
  getMacroByShortcut,
  getMacroCategories
} from '../controllers/macrosController';

const router = express.Router();

// Rotas para macros
router.get('/', getMacros);
router.post('/', createMacro);
router.get('/categories', getMacroCategories);
router.get('/shortcut/:shortcut', getMacroByShortcut);
router.get('/:id', getMacro);
router.put('/:id', updateMacro);
router.delete('/:id', deleteMacro);
router.post('/:id/use', useMacro);

export default router;
