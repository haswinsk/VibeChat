import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const protect = async (req, res, next) => {
  let token;

  // Check if token exists in cookies
  token = req.cookies?.jwt;
  console.log('[AUTH] Cookie token:', token ? 'Present' : 'Not found');

  // Fallback to Bearer token in headers (for APIs or mobile apps)
  if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
    console.log('[AUTH] Header token:', token ? 'Present' : 'Not found');
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.userId).select('-password');

      if (!req.user) {
        console.log(`[AUTH] User not found for token.`);
        return res.status(401).json({ message: 'Your account has been removed.' });
      }

      if (req.user.isBanned) {
        console.log(`[AUTH] Banned user attempt: ${req.user.email}`);
        return res.status(401).json({ message: 'Your account has been banned.' });
      }

      console.log('[AUTH] Token verified successfully for user:', req.user?.email);
      next();
    } catch (error) {
      console.error('[AUTH] Token verification failed:', error.message);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } else {
    console.log('[AUTH] No token found in cookies or headers');
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

export { protect };
