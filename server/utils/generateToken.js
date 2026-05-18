import jwt from 'jsonwebtoken';

const generateToken = (res, userId) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });

  console.log('[GENERATE TOKEN] Token created:', token ? 'Success' : 'Failed');

  res.cookie('jwt', token, {
    httpOnly: true,
    secure: true, // Always true for cross-site cookies in production
    sameSite: 'none', // Required for cross-site cookies (Vercel to Render)
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });

  console.log('[GENERATE TOKEN] Cookie set');
  return token;
};

export default generateToken;
