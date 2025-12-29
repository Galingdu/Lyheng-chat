import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    text: {
      type: String,
      default: null
    },
    image: {
      type: String, // chat image path
      default: null
    }
  },
  { timestamps: true }
);

export default mongoose.model('Message', messageSchema);
