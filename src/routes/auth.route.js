import express from 'express';
import { register, login } from '../controllers/auth.controller.js';
import multer from 'multer';

const router = express.Router();

// MEMORY STORAGE (NO DISK)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

router.post("/register", upload.single("avatar"), register);
router.post('/login', login);

export default router;
