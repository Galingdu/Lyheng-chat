import multer from 'multer';
import path from 'path';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'src/uploads/chats');
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `chat-${Date.now()}${ext}`;
    cb(null, filename);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

  if (!allowedTypes.includes(file.mimetype)) {
    cb(new Error('Only JPG, PNG, WEBP allowed'), false);
  } else {
    cb(null, true);
  }
};

const uploadChatImage = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
}).single('image');

export default uploadChatImage;
