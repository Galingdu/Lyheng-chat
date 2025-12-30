import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cloudinary from '../config/cloudinary.js';

/* ================= REGISTER ================= */
export const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // ❗ check duplicate
    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    let avatarUrl = "";

    // ✅ UPLOAD AVATAR IF EXISTS
    if (req.file) {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "avatars",
          resource_type: "image",
        },
        async (error, result) => {
          if (error) {
            return res.status(500).json({ message: error.message });
          }

          avatarUrl = result.secure_url;

          const user = await User.create({
            username,
            email,
            password: hashedPassword,
            avatar: avatarUrl,
          });

          const token = jwt.sign(
            { id: user._id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
          );

          return res.status(201).json({
            message: "Register success",
            token,
            user: {
              id: user._id,
              username: user.username,
              avatar: user.avatar,
            },
          });
        }
      );

      uploadStream.end(req.file.buffer);
      return;
    }

    // ✅ NO AVATAR
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      avatar: "",
    });

    const token = jwt.sign(
      { id: user._id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.status(201).json({
      message: "Register success",
      token,
      user: {
        id: user._id,
        username: user.username,
        avatar: user.avatar,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }
const token = jwt.sign(
  { id: user._id, username: user.username },
  process.env.JWT_SECRET,
  { expiresIn: '1d' }
);

res.json({
  message: 'Login success',
  token,
  user: {
    id: user._id,
    username: user.username,
    avatar: user.avatar
  }
});

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
