import express from 'express';
import { adminLogin, verifyAdminAccess } from '../controllers/adminAuthController.js';

const router = express.Router();

// Admin login (no protection - for entering admin area)
router.post('/login', adminLogin);

// Verify admin access (protected)
router.get('/verify', verifyAdminAccess);

export default router;
