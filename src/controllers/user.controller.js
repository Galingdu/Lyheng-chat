import User from "../models/User.js";
import cloudinary from "../config/cloudinary.js";

export const getMe = async (req,res) =>{
    try{
        const user = await User.findById(req.user.id).select(
            "_id username avatar email"
        );
        if(!user){
            return res.status(404).json({message: "User not found"});
        }
        res.json(user);

    }catch(err){
        res.status(500).json({message: err.message});

    }
}

export const getUserCount  = async (req,res)=>{
    try{
       const count = await User.countDocuments();
        res.json({ totalUsers: count });

    }catch(err){
        res.status(500).json({ message: err.message });

    }
}

/* ================= UPLOAD AVATAR ================= */
export const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No avatar uploaded" });
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "avatars",
        resource_type: "image",
      },
      async (error, result) => {
        if (error) {
          return res.status(500).json({ message: error.message });
        }

        // ✅ save avatar URL to user
        const user = await User.findByIdAndUpdate(
          req.user.id,
          { avatar: result.secure_url },
          { new: true }
        );

        res.json({
          avatar: user.avatar,
        });
      }
    );

    uploadStream.end(req.file.buffer);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}