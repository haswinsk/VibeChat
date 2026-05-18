import express from 'express';
import { createOrGetRoom, getRoom } from '../controllers/roomController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/create', protect, createOrGetRoom);
router.get('/:id', protect, getRoom);

export default router;
