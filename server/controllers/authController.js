import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
export const authUser = async (req, res) => {
  const { email, password } = req.body;
  console.log('[LOGIN] Attempting login for email:', email);

  const user = await User.findOne({ email });

  if (!user) {
    console.log('[LOGIN] User not found:', email);
    res.status(401).json({ message: 'Invalid email or password' });
    return;
  }

  const isPasswordValid = await user.matchPassword(password);
  if (!isPasswordValid) {
    console.log('[LOGIN] Invalid password for user:', email);
    res.status(401).json({ message: 'Invalid email or password' });
    return;
  }

  console.log('[LOGIN] Login successful for:', email);
  const token = generateToken(res, user._id);

  console.log('[LOGIN] About to send response with token:', token ? 'Present' : 'MISSING');
  const response = {
    _id: user._id,
    name: user.name,
    email: user.email,
    profilePic: user.profilePic,
    token: token,
  };
  console.log('[LOGIN] Response object:', response);
  res.json(response);
};

// @desc    Register a new user
// @route   POST /api/auth/signup
// @access  Public
export const registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  const userExists = await User.findOne({ email });

  if (userExists) {
    // Check if user was deleted
    if (userExists.isDeleted) {
      res.status(400).json({ message: 'This email was previously deleted and cannot be used again' });
      return;
    }
    res.status(400).json({ message: 'User already exists' });
    return;
  }

  const user = await User.create({
    name,
    email,
    password,
  });

  if (user) {
    console.log('[SIGNUP] New user created:', email);
    const token = generateToken(res, user._id);

    console.log('[SIGNUP] About to send response with token:', token ? 'Present' : 'MISSING');
    const response = {
      _id: user._id,
      name: user.name,
      email: user.email,
      profilePic: user.profilePic,
      token: token,
    };
    console.log('[SIGNUP] Response object:', response);
    res.status(201).json(response);
  } else {
    res.status(400).json({ message: 'Invalid user data' });
  }
};

// @desc    Logout user / clear cookie
// @route   POST /api/auth/logout
// @access  Public
export const logoutUser = (req, res) => {
  res.cookie('jwt', '', {
    httpOnly: true,
    expires: new Date(0),
  });
  res.status(200).json({ message: 'Logged out successfully' });
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
export const getUserProfile = async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      profilePic: user.profilePic,
    });
  } else {
    res.status(404).json({ message: 'User not found' });
  }
};
