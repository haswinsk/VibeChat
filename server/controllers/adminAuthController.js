import User from '../models/User.js';
import jwt from 'jsonwebtoken';

// @desc    Admin login verification
// @route   POST /api/admin-auth/login
// @access  Public
export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      console.log('[ADMIN AUTH] Missing email or password');
      return res.status(400).json({ message: 'Email and password required' });
    }

    // Find user by email
    const user = await User.findOne({ email });

    if (!user) {
      console.log(`[ADMIN AUTH] User not found: ${email}`);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Verify password
    const isPasswordCorrect = await user.matchPassword(password);

    if (!isPasswordCorrect) {
      console.log(`[ADMIN AUTH] Wrong password for: ${email}`);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if user is admin
    if (!user.isAdmin) {
      console.log(`[ADMIN AUTH] Non-admin trying to access: ${email}`);
      return res.status(403).json({ message: 'Access denied - Not admin' });
    }

    // Optional: Verify ADMIN_EMAIL
    if (process.env.ADMIN_EMAIL && user.email !== process.env.ADMIN_EMAIL) {
      console.log(`[ADMIN AUTH] Email mismatch: ${email} != ${process.env.ADMIN_EMAIL}`);
      return res.status(403).json({ message: 'Access denied - Not authorized admin' });
    }

    // Generate token (use userId to match authMiddleware pattern)
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: '7d'
    });

    // Set secure cookie
    res.cookie('admin-token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    console.log(`[ADMIN AUTH] Admin logged in successfully: ${email}`);

    res.status(200).json({
      message: 'Admin access granted',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin
      }
    });
  } catch (error) {
    console.error('[ADMIN AUTH] Login error:', error);
    res.status(500).json({ message: 'Login failed' });
  }
};

// @desc    Verify admin has valid token
// @route   GET /api/admin-auth/verify
// @access  Private
export const verifyAdminAccess = async (req, res) => {
  try {
    let token;

    if (req.cookies['admin-token']) {
      token = req.cookies['admin-token'];
    } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user || !user.isAdmin) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    res.status(200).json({
      valid: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin
      }
    });
  } catch (error) {
    console.log('[ADMIN AUTH] Verification failed:', error.message);
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};
