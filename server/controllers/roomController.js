import Room from '../models/Room.js';

// @desc    Create or get a music room
// @route   POST /api/rooms/create
// @access  Private
export const createOrGetRoom = async (req, res) => {
  try {
    const { roomName } = req.body;

    if (!roomName) {
      return res.status(400).json({ message: 'Room name is required' });
    }

    let room = await Room.findOne({ roomName });

    if (!room) {
      room = await Room.create({
        roomName,
        currentSong: null,
        currentTime: 0,
        isPlaying: false,
        updatedBy: req.user._id,
      });
    }

    res.status(200).json(room);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to create or get room' });
  }
};

// @desc    Get room by ID
// @route   GET /api/rooms/:id
// @access  Private
export const getRoom = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);

    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    res.status(200).json(room);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch room' });
  }
};
