import mongoose from 'mongoose';

const musicRoomSchema = new mongoose.Schema(
  {
    roomId: {
      type: String,
      required: true,
      unique: true,
    },
    users: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    currentSongUrl: {
      type: String,
      default: '',
    },
    currentSongName: {
      type: String,
      default: '',
    },
    currentTime: {
      type: Number,
      default: 0,
    },
    isPlaying: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const MusicRoom = mongoose.model('MusicRoom', musicRoomSchema);

export default MusicRoom;
