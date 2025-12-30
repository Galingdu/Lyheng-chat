import Message from "../models/Message.js";
import cloudinary from "../config/cloudinary.js";

/* ================= GET CHAT MESSAGES ================= */
export const getMessages = async (req, res) => {
  try {
    const messages = await Message.find()
      .populate("sender", "username avatar role")
      .sort({ createdAt: -1 })
      .limit(100);

    res.json(messages.reverse());
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ================= UPLOAD CHAT IMAGE (CLOUDINARY) ================= */
export const uploadChatImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image uploaded" });
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "chat-images",
        resource_type: "image",
      },
      (error, result) => {
        if (error) {
          return res.status(500).json({ message: error.message });
        }

        // ✅ RETURN URL (NOT filename)
        res.json({
          image: result.secure_url,
        });
      }
    );

    uploadStream.end(req.file.buffer);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
