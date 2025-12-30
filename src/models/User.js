import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true
    },
    password: {
      type: String,
      required: true
    },
    avatar: {
      type: String, // store file path or filename
      default:"",
    },
    role: {
    type: String,
    enum: ["user", "admin"],
    default: "user" // 👈 everyone is user by default
  }
  },
  { timestamps: true }
);

export default mongoose.model('User', userSchema);
