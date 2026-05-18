import cloudinary from './config/cloudinary.js';

async function testUpload() {
  try {
    const result = await cloudinary.uploader.upload('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', {
      folder: 'vibechat_test',
    });
    console.log('Upload successful:', result.secure_url);
  } catch (error) {
    console.error('Cloudinary error:', error);
  }
}

testUpload();
