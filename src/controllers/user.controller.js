import User from "../models/User.js";

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