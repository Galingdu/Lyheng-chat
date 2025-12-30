import express from "express";
import multer from "multer";
import authMiddleware from "../middleware/auth.middleware.js";
import {
  getMessages,
  uploadChatImage,
} from "../controllers/chat.controller.js";

const router = express.Router();

/* ================= MULTER MEMORY STORAGE ================= */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

/* ================= ROUTES ================= */
router.get("/", authMiddleware, getMessages);

router.post(
  "/image",
  authMiddleware,
  upload.single("image"),
  uploadChatImage
);

export default router;
