const Post = require('../models/Post');
const User = require('../models/User');
const {sendEmail} = require('../middlewares/sendEmail');
const crypto = require('crypto');


exports.register = async (req, res) => {
    try{
        const {name, email, password, private, bio} = req.body;
        
        let user = await User.findOne({email});
        if(user){
            return res.status(400).json({success:false, message:"user already exists"})
        }

        user = await User.create({
            name, email, password, bio, avatar:{public_id:"sample_id", url:"sample_url"}, private
        }); 

 
        const options = {
            expires:new Date(Date.now()+90*24*60*60*1000),
            httpOnly:true
        }
        const token = await user.generateToken();
        res.status(201).cookie("token", token, options).json({
            success:true,
            message:"User created and login successfully",
            user,
            token
        })
        
    }
    catch(err){
        res.status(500).json({success:false, message:err.message})
    }
}


exports.login = async(req, res) =>{
    try {
        const {email, password} = req.body;
        let user = await User.findOne({email}).select("+password");
        if(!user){
            return res.status(400).json({
                success:false,
                message:"User with this e-mail dosn't exists"
            })
        }
        const isMatch = await user.matchPassword(password);
        if(!isMatch){
            return res.status(400).json({
                success:false,
                message:"Incorrect Password"
            })
        }

        const options = {
            expires:new Date(Date.now()+90*24*60*60*1000),
            httpOnly:true
        }
        const token = await user.generateToken();
        res.status(200).cookie("token", token, options).json({
            success:true,
            message:"User login successfully",
            user,
            token
        })
    } 
    catch(err){
        res.status(500).json({success:false, message:err.message})
    }
}



exports.followUser = async(req, res)=>{
    try {
        const userToFollow = await User.findById(req.params.id);
        const loggedInUser = await User.findById(req.user._id);

        if(!userToFollow){
            return res.status(404).json({
                success:false,
                message:"User not found"
            });
        }
        if(loggedInUser.following.includes(userToFollow._id)){
            const index1 = userToFollow.followers.indexOf(loggedInUser._id);
            const index2 = loggedInUser.following.indexOf(userToFollow._id);
            userToFollow.followers.splice(index1, 1);
            loggedInUser.following.splice(index2, 1);
            userToFollow.save();
            loggedInUser.save();
            return res.status(200).json({
                success:true,
                message:`${userToFollow.name} Unfollowed`
            })
        }
        userToFollow.followers.push(loggedInUser._id);
        loggedInUser.following.push(userToFollow._id);
        await userToFollow.save();
        await loggedInUser.save();

        res.status(200).json({
            success:true,
            message:`You started following ${userToFollow.name}`
        })

    } catch (err) {
        res.status(500).json({success:false, message:err.message})
        
    }
}


exports.logout = async (req, res) => {
    try {
        res.status(200).cookie("token", null, {expires:new Date(Date.now()), httpOnly:true}).json({
            success:true,
            message:"Logged out successfully"
        })
    } catch (error) {
        res.status(500).json({
            success:false,
            message:error.message
        })
        
    }
}


exports.updatePassword = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select("+password");
        const {oldPassword, newPassword} = req.body;

        if(!oldPassword || !newPassword){
            return res.status(400).json({ 
                success:false,
                message:"Please fill old password or new Password"
            })
        }
        const isMatch = await user.matchPassword(oldPassword);
        if(!isMatch){
            return res.status(400).json({
                success:false,
                message:"Incorrect Password"
            })
        }
        user.password = newPassword;
        await user.save();
        return res.status(200).json({
            success:true,
            message:"Password updated"
        })
        
    } catch (error) {
        res.status(500).json({
            success:false,
            message:error.message
        })
    }
}



exports.UpdateProfile = async (req, res) => {
    try {
        const {email, name} = req.body;
        const user = await User.findById(req.user._id);
        if(email){
            user.email=email;
        }
        if(name){
            user.name = name;
        }
        user.save();
        return res.status(200).json({
            success:true,
            message:"Profile Updated"
        });
    } catch (error) {
        return res.status(500).json({
            success:false,
            message:error.message
        })
    }
    
}

exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        const posts = user.post;
        const followers = user.followers;
        const followings = user.following;

        //remove all posts
        for (let i = 0; i < posts.length; i++) {
            const post = await Post.findById(posts[i]);
            await post.remove();
        }
        //user ke follower and following me se bhi delete krna hai
        for (let i = 0; i < followers.length; i++) {
            const follower = await User.findById(followers[i]);
            const index = follower.following.indexOf(user._id);
            follower.following.splice(index, 1);
            await follower.save();
        }
        for (let i = 0; i < followings.length; i++) {
            const following = await User.findById(followings[i]);
            const index = following.followers.indexOf(user._id);
            following.followers.splice(index, 1);
            await following.save();
        }
        // delete all comments done by him
        


        //logout user 
        res.cookie("token", null, {expires:new Date(Date.now()), httpOnly:true});
        await user.remove();
        return res.status(200).json({
            success:true,
            message:"User Deleted"
        })
    } catch (error) {
        return res.status(500).json({
            success:false,
            message:error.message
        })
    }
}


exports.myProfile = async (req, res) => {
    try {
        const data = await User.findById(req.user._id).populate("post");

        return res.status(200).json({
            success:true,
            data
        })
    } catch (error) {
        res.status(500).json({
            success:false,
            message:error.message
        });
    }
}

exports.getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).populate("post");
        if(!user){
            return res.status(404).json({
                success:false,
                message:"User not found"
            });
        }
        if(user.private && !user.followers.includes(req.user._id)){
            const a = await User.findById(req.params.id);
            // const aobj = JSON.parse(a);
            return res.status(200).json({
                success:true,
                name:a.name,
                message:"Account is Private"
            });
        }
        else{
            return res.status(200).json({
                success:true,
                user
            });
        }
        
    } catch (error) {
        res.status(500).json({
            success:false,
            message:error.message
        });
    }
}



exports.forgotPassword = async (req, res) => {
    try {
        const user = await User.findOne({email:req.body.email});
        if(!user){
            return res.status(404).json({
                success:false,
                message:"User not found"
            });
        }

        const resetPasswordToken = await user.getResetPasswordToken();
        await user.save();
        const resetURL = `${req.protocol}://${req.get("host")}/api/v1/password/reset/${resetPasswordToken}`;
        const message = `Reset Your Password using this link:\n \n ${resetURL} \n Link Valid for 10 minutes \n Don't share this link with anyone`;

        try {
            await sendEmail({
                email:user.email,
                subject:"Reset Password",
                message
            });
            res.status(200).json({
                success:true,
                message:`email sent to ${user.email}`
            });
        } catch (error) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;
            await user.save();
        }



    } catch (error) {
        res.status(500).json({
            success:false,
            message:error.message
        });
    }
}

exports.resetPassword = async (req, res) => {
    try {
        const resetPasswordToken = crypto.createHash("sha256").update(req.params.token).digest("hex");
        const user = await User.findOne({
            resetPasswordToken, 
            resetPasswordExpire:{$gt:Date.now()}
        });

        if(!user){
            return res.status(401).json({
                success:false,
                message:"Token is invalid or expired"
            });
        }

        user.password = req.body.password;
        user.resetPasswordExpire = undefined;
        user.resetPasswordToken = undefined;
        await user.save();
        return res.status(200).json({
            success:true,
            message:"Password Reset"
        })

    } catch (error) {
        res.status(500).json({
            success:false,
            message:error.message
        });
    }
}