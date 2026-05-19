import User from '../models/User.js';

// @desc    Search for users by publicId
// @route   GET /api/users/search
// @access  Private
export const searchUsers = async (req, res) => {
  const query = req.query.query;

  if (!query) {
    return res.status(400).json({ message: 'Search query is required' });
  }

  try {
    const users = await User.find({
      publicId: { $regex: query, $options: 'i' },
      _id: { $ne: req.user._id }, // Exclude the current user from search results
    }).select('name publicId profilePic'); // Only select necessary fields

    res.json(users);
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
