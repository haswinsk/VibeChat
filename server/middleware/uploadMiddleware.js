import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary.js';

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'vibechat',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
  },
});

const audioStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'vibechat_songs',
    resource_type: 'video',
    allowed_formats: ['mp3', 'wav', 'm4a', 'ogg', 'aac'],
  },
});

const voiceStorage = multer.memoryStorage();

const upload = multer({ storage });
export const uploadAudio = multer({ storage: audioStorage });
export const uploadVoice = multer({ 
  storage: voiceStorage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10 MB limit
});

export default upload;
