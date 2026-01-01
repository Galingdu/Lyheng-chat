import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    type: {
      type: String,
      enum: ["text", "image", "music"], // ✅ restrict values
      default: "text",
    },

    text: {
      type: String,
      default: null,
    },

    image: {
      type: String,
      default: null,
    },

    youtubeId: {
      type: String,
      default: null,
    },

    title: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);


export default mongoose.model('Message', messageSchema);
