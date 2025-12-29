import multer from 'multer';
import path from 'path';

// storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'src/uploads/avatars');
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `avatar-${Date.now()}${ext}`;
    cb(null, filename);
  }
});

// file filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

  if (!allowedTypes.includes(file.mimetype)) {
    cb(new Error('Only JPG, PNG, WEBP allowed'), false);
  } else {
    cb(null, true);
  }
};

const uploadAvatar = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB
  }
}).single('avatar');

export default uploadAvatar;
