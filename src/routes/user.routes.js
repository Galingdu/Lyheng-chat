import express from 'express';
import authenticate from '../middleware/auth.middleware.js';
import { getMe,getUserCount  } from '../controllers/user.controller.js';


const router = express.Router();
const protect = authenticate;

router.get('/me', protect, getMe);
router.get('/count',getUserCount )

export default router;