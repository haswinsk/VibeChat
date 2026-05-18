import express from 'express';
import { getMessages, sendMessage, getUsersForSidebar, clearChat, markMessagesAsRead, sendMusicInvite, updateMusicInvite } from '../controllers/messageController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/users', protect, getUsersForSidebar);
router.get('/:userId', protect, getMessages);
router.post('/send', protect, sendMessage);
router.post('/invite', protect, sendMusicInvite);
router.put('/invite/:messageId', protect, updateMusicInvite);
router.delete('/:userId', protect, clearChat);
router.put('/read/:senderId', protect, markMessagesAsRead);

export default router;
