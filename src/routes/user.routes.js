import express from 'express';
import authenticate from '../middleware/auth.middleware.js';
import { getMe,getUserCount,uploadAvatar  } from '../controllers/user.controller.js';
import multer from 'multer';


const router = express.Router();
const protect = authenticate;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
});

router.post(
  "/avatar",
  protect,
  upload.single("avatar"),
  uploadAvatar
);


router.get('/me', protect, getMe);
router.get('/count',protect,getUserCount )

export default router;