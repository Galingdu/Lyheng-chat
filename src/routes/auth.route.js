import express from 'express';
import { register, login } from '../controllers/auth.controller.js';
import uploadAvatar from '../utils/avatarUpload.js';

const router = express.Router();

router.post('/register', uploadAvatar, register);
router.post('/login', login);

export default router;
