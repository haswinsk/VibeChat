import express from 'express';
import {
  getAdminStats,
  getAllUsers,
  getUserById,
  toggleUserAdmin,
  getRecentActivity,
  getAllRooms,
  getAdminInfo,
  deleteUser
} from '../controllers/adminController.js';
import { adminProtect } from '../middleware/adminMiddleware.js';

const router = express.Router();

// All routes protected with admin middleware
router.use(adminProtect);

// Admin dashboard stats
router.get('/stats', getAdminStats);

// Admin info/verification
router.get('/me', getAdminInfo);

// User management
router.get('/users', getAllUsers);
router.get('/users/:id', getUserById);
router.put('/users/:id/toggle-admin', toggleUserAdmin);
router.delete('/users/:id', deleteUser);

// Activity monitoring
router.get('/activity', getRecentActivity);

// Room management
router.get('/rooms', getAllRooms);

export default router;
