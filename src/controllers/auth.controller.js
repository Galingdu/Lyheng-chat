import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;


    const hashedPassword = await bcrypt.hash(password, 10);
    const avatarPath = req.file
  ? req.file.filename
  : 'default.jpg';

    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      avatar: avatarPath
    });

    res.status(201).json({
      message: 'Register success',
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
