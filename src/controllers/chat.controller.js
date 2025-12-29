import Message from '../models/Message.js';

// export const sendMessage = async (req, res) => {
//   try {
//     const { senderId, text } = req.body;

//     const message = await Message.create({
//       sender: senderId,
//       text: text || null,
//       image: req.file ? req.file.filename : null
//     });

//     res.status(201).json(message);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };

export const uploadChatImage = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No image uploaded" });
  }

  res.json({
    image: req.file.filename
  });
};

export const getMessages = async (req, res) => {
  try {
    const messages = await Message.find()
      .populate('sender', 'username avatar')
      .sort({ createdAt: -1 })
      .limit(100);

    res.json(messages.reverse()); // oldest → newest
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

