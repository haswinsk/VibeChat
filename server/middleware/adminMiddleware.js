import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const adminProtect = async (req, res, next) => {
  try {
    let token;

    // Get token from cookies or Authorization header
    if (req.cookies.jwt) {
      token = req.cookies.jwt;
    } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // If no token found
    if (!token) {
      console.log('[ADMIN] No token provided');
      return res.status(401).json({ message: 'Not authorized - No token' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    // User must exist
    if (!user) {
      console.log('[ADMIN] User not found');
      return res.status(401).json({ message: 'Not authorized - User not found' });
    }

    // User must have isAdmin flag
    if (!user.isAdmin) {
      console.log(`[ADMIN] Access denied - ${user.email} is not admin`);
      return res.status(403).json({ message: 'Forbidden - Admin access required' });
    }

    // Optional: Verify ADMIN_EMAIL if set
    if (process.env.ADMIN_EMAIL && user.email !== process.env.ADMIN_EMAIL) {
      console.log(`[ADMIN] Email mismatch - ${user.email} != ${process.env.ADMIN_EMAIL}`);
      return res.status(403).json({ message: 'Forbidden - Not authorized admin' });
    }

    console.log(`[ADMIN] Access granted to ${user.email}`);
    req.user = user;
    next();
  } catch (error) {
    console.log('[ADMIN] Token verification failed:', error.message);
    res.status(401).json({ message: 'Not authorized - Invalid token' });
  }
};
