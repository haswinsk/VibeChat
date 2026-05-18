import User from '../models/User.js';
import Message from '../models/Message.js';
import Room from '../models/Room.js';
import MusicRoom from '../models/MusicRoom.js';

// @desc    Get admin dashboard stats
// @route   GET /api/admin/stats
// @access  Private/Admin
export const getAdminStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const onlineUsers = await User.countDocuments({ onlineStatus: true });
    const totalMessages = await Message.countDocuments();
    const totalRooms = await Room.countDocuments();
    const activeMusicRooms = await MusicRoom.countDocuments();

    // Get messages in last 24 hours
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const messagesLast24h = await Message.countDocuments({
      createdAt: { $gte: last24Hours }
    });

    res.status(200).json({
      totalUsers,
      onlineUsers,
      totalMessages,
      messagesLast24h,
      totalRooms,
      activeMusicRooms,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('[ADMIN] Error getting stats:', error);
    res.status(500).json({ message: 'Failed to fetch stats' });
  }
};

// @desc    Get all users (admin view)
// @route   GET /api/admin/users
// @access  Private/Admin
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(100);

    res.status(200).json(users);
  } catch (error) {
    console.error('[ADMIN] Error getting users:', error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
};

// @desc    Get user by ID (admin view)
// @route   GET /api/admin/users/:id
// @access  Private/Admin
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get user's message count
    const messageCount = await Message.countDocuments({
      $or: [{ senderId: user._id }, { receiverId: user._id }]
    });

    // Get user's rooms
    const rooms = await Room.find({
      $or: [{ createdBy: user._id }, { members: user._id }]
    });

    res.status(200).json({
      user,
      messageCount,
      roomCount: rooms.length,
      createdAt: user.createdAt,
      lastActive: user.onlineStatus ? 'Now' : 'Unknown'
    });
  } catch (error) {
    console.error('[ADMIN] Error getting user:', error);
    res.status(500).json({ message: 'Failed to fetch user' });
  }
};

// @desc    Toggle user admin status
// @route   PUT /api/admin/users/:id/toggle-admin
// @access  Private/Admin
export const toggleUserAdmin = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.isAdmin = !user.isAdmin;
    await user.save();

    console.log(`[ADMIN] Admin status toggled for ${user.email}: ${user.isAdmin}`);

    res.status(200).json({
      message: `User ${user.isAdmin ? 'promoted to' : 'demoted from'} admin`,
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        isAdmin: user.isAdmin
      }
    });
  } catch (error) {
    console.error('[ADMIN] Error toggling admin:', error);
    res.status(500).json({ message: 'Failed to update user' });
  }
};

// @desc    Get recent activity
// @route   GET /api/admin/activity
// @access  Private/Admin
export const getRecentActivity = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;

    // Get recent messages
    const recentMessages = await Message.find()
      .populate('senderId', 'name email')
      .populate('receiverId', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit);

    // Get recent user registrations
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('-password');

    res.status(200).json({
      recentMessages: recentMessages.slice(0, 20),
      recentUsers: recentUsers.slice(0, 20),
      messageActivityCount: recentMessages.length,
      userActivityCount: recentUsers.length
    });
  } catch (error) {
    console.error('[ADMIN] Error getting activity:', error);
    res.status(500).json({ message: 'Failed to fetch activity' });
  }
};

// @desc    Get all rooms
// @route   GET /api/admin/rooms
// @access  Private/Admin
export const getAllRooms = async (req, res) => {
  try {
    const rooms = await Room.find()
      .populate('createdBy', 'name email')
      .populate('members', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json(rooms);
  } catch (error) {
    console.error('[ADMIN] Error getting rooms:', error);
    res.status(500).json({ message: 'Failed to fetch rooms' });
  }
};

// @desc    Get admin info (verify admin access)
// @route   GET /api/admin/me
// @access  Private/Admin
export const getAdminInfo = async (req, res) => {
  try {
    const admin = await User.findById(req.user._id).select('-password');

    res.status(200).json({
      admin,
      isAdmin: req.user.isAdmin,
      email: req.user.email
    });
  } catch (error) {
    console.error('[ADMIN] Error getting admin info:', error);
    res.status(500).json({ message: 'Failed to fetch admin info' });
  }
};
