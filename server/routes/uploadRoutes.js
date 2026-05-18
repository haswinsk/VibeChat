import express from 'express';
import upload, { uploadAudio, uploadVoice } from '../middleware/uploadMiddleware.js';
import { protect } from '../middleware/authMiddleware.js';
import cloudinary from '../config/cloudinary.js';

const router = express.Router();

// @desc    Upload an image
// @route   POST /api/upload/image
// @access  Private
router.post('/image', protect, upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Please upload an image' });
  }
  
  res.status(200).json({
    imageUrl: req.file.path,
    message: 'Image uploaded successfully',
  });
});

// @desc    Upload an audio song
// @route   POST /api/upload/song
// @access  Private
router.post('/song', protect, uploadAudio.single('song'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Please upload an audio file' });
  }
  
  const name = req.file.originalname
    .replace(/\.[^/.]+$/, '')
    .replace(/_/g, ' ');

  res.status(200).json({
    songUrl: req.file.path,
    name,
    message: 'Song uploaded successfully',
  });
});

// @desc    Upload a voice message
// @route   POST /api/upload/audio
// @access  Private
router.post('/audio', protect, uploadVoice.single('audio'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Please upload an audio file' });
  }

  const uploadStream = cloudinary.uploader.upload_stream(
    {
      folder: 'vibechat_voice',
      resource_type: 'video',
    },
    (error, result) => {
      if (error) {
        console.error('Cloudinary stream upload error:', error);
        return res.status(500).json({ message: 'Cloudinary upload error', error: error.message || error });
      }
      res.status(200).json({
        audioUrl: result.secure_url,
        duration: req.body.duration ? parseFloat(req.body.duration) : 0,
        message: 'Voice note uploaded successfully',
      });
    }
  );

  uploadStream.end(req.file.buffer);
});

// @desc    Get all Cloudinary songs
// @route   GET /api/upload/songs
// @access  Private
router.get('/songs', protect, async (req, res) => {
  try {
    const result = await cloudinary.api.resources({
      resource_type: 'video',
      max_results: 100,
    });
    
    // Filter for audio files
    const songs = result.resources
      .filter((file) => ['mp3', 'wav', 'm4a', 'ogg', 'aac'].includes(file.format?.toLowerCase()) || file.secure_url?.toLowerCase().endsWith('.mp3'))
      .map((file) => {
        let name = file.public_id.split('/').pop().replace(/_/g, ' ');
        return {
          name,
          url: file.secure_url,
        };
      });
      
    res.status(200).json(songs);
  } catch (error) {
    console.error('Error fetching Cloudinary songs:', error);
    res.status(500).json({ message: 'Failed to fetch songs from Cloudinary' });
  }
});

export default router;
