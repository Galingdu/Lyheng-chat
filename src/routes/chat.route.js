import express from 'express';
import { getMessages,uploadChatImage } from '../controllers/chat.controller.js';
import chatUpload from '../utils/chatUpload.js';
import authMiddleware from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/', getMessages);
router.post(
  '/image',
  authMiddleware,
  chatUpload,
  uploadChatImage
);


export default router;
