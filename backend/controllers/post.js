const Post = require('../models/Post');
const User = require('../models/User');
 
// Create new post => /api/v1/post
exports.createPost = async (req, res) => {
    try{
        const newPostData={
            caption:req.body.caption,
            image:{
                public_id:"req.body.image.public_id",
                url:"req.body.image.url"
            },
            owner:req.user._id

        }
        const post = await Post.create(newPostData);
        const user = await User.findById(req.user._id);
        user.post.push(post._id); 
        await user.save();
        res.status(201).json({
            success:true,
            message:"post created successfully",
            post
        })
    }
    catch(err){
        res.status(500).json({
            success:false,
            message:err.message
        })
    }
};


exports.likedislikepost = async (req, res)=>{
    try {
        const post = await Post.findById(req.params.id);
        if(!post){
            return res.status(404).json({
                success:false,
                message:"Post not found"

            });
        }

        if(post.likes.includes(req.user._id)){
            const index = post.likes.indexOf(req.user._id)
            post.likes.splice(index, 1);

            await post.save();
            return res.status(200).json({
                success:true,
                message:"Post Disliked"
            });
        }
        else{
            post.likes.push(req.user._id);
            await post.save();
            await post.save();
            return res.status(200).json({
                success:true,
                message:"Post Liked"
            });
        }

    } catch (err) {
        res.status(500).json({
            success:false,
            message:"Server is fasing some issue!! try again later"
        })
    }
}



exports.deletePost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if(!post){
            return res.status(404).json({
                success:false,
                message:"Post not found"
            })
        }

        if(post.owner.toString() !== req.user._id.toString()){
            return res.status(401).json({// request not complete due to invalid authentication.
                success:false,
                message:"Unauthorized"
            })
        }

        await post.remove();
        const user = await User.findById(req.user._id);
        const index = user.post.indexOf(req.params.id);
        user.post.splice(index, 1); 
        await user.save();

        return res.status(200).json({
            success:true,
            message:"Post deleted successfully"
        })
        

    } catch (err) {
        return res.status(500).json({
            success:false,
            message:err.message
        });
    }
}



exports.getPostOfFollowing = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        let post =[];
        // for (let i = 0; i < user.following.length; i++) {
        //     const followedUser = await User.findById(user.following[i]);
        //     for (let j = 0; j < followedUser.post.length; j++) {
        //         post.push(followedUser.post[j]);
        //     }
        // }

        const posts = await Post.find({
            owner:{
                $in:user.following
            }
        })

        return res.status(200).json({
            success:true,
            message:"Successfully get all the posts",
            posts
        })
    } catch (err) {
        return res.status(500).json({
            success:false,
            message:err.message
        })
    }
}

exports.updateCaption = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        const {caption} = req.body;
        if(!post){
            return res.status(404).json({
                success:false,
                message:"Post not found"
            });
        }
        if (post.owner.toString()!==req.user._id.toString()) {
            return res.status(401).json({
                success:false,
                message:"Unauthorized"
            })
        }
        post.caption = caption;
        post.save();
        return res.status(200).json({
            success:true,
            message:"Caption Updated"
        })

    } catch (error) {
        return res.status(500).json({
            success:false,
            message:err.message
        })
    }
}


exports.doCommentonPost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if(!post){
            return res.status(404).json({
                success:false,
                message:"Post not found"
            });
        }
        const {comment} = req.body;
        const user = await User.findById(req.user._id);
        const postowner = await User.findById(post.owner);
        
        if(!postowner.followers.includes(user._id) && postowner.private){
            return res.status(400).json({
                success:false,
                message:"Private account"
            });
        }
        let commentIndex = -1;
        post.comments.forEach((item, index) => {
            if(item.user.toString() === req.user._id.toString()){
                commentIndex = index;
            }
        });
        if(commentIndex !== -1){
            post.comments[commentIndex].comment = comment;
            post.save();
            res.status(200).json({
                success:true,
                message:"comment updated"
            });
        }
        else{
            post.comments.push({
                comment,
                user
            });
            post.save();
            res.status(200).json({
                success:true,
                message:"Commented",
                comment
            });
        }
        

    } catch (error) {
        res.status(500).json({
            success:false,
            message:error.message
        });
    }
}


exports.deleteComment = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        const user = await User.findById(req.user._id);
        const postowner = await User.findById(post.owner._id);
        if(!post){
            return res.status(404).json({
                success:false,
                message:"Post not found"
            });
        }
        
        if (post.owner.toString() === req.user._id.toString()) {
            if(req.body.commentId == undefined){
                return res.status(400).json({
                    success:false,
                    message:"comment id is required"
                })
            }
            let iscomment = false;
            post.comments.forEach((item, index) => {
                if(item._id.toString() === req.body.commentId.toString()){
                    iscomment = true;
                    return post.comments.splice(index, 1);
                }
            });
            if(iscomment){
                await post.save();

                return res.status(200).json({
                    success:true,
                    message:"Comment deleted"
                });
            }
            else{
                return res.status(404).json({
                    success:false,
                    message:"comment not found"
                });
            }
            

        }else{
            if(!postowner.followers.includes(user._id) && postowner.private){
                return res.status(400).json({
                    success:false,
                    message:"Private account"
                });
            }
            let iscomment = false;
            post.comments.forEach((item, index) => {
                if(item.user.toString() === req.user._id.toString()){
                    iscomment = true;
                    return post.comments.splice(index, 1);
                    
                }
            });
            if(iscomment){
                await post.save();
                return res.status(200).json({
                    success:true,
                    message:"Your comment is deleted"
                });
            }
            else{
                return res.status(404).json({
                    success:false,
                    message:"comment not found"
                });
            }
            
        }
    } catch (error) {
        res.status(500).json({
            success:false,
            message:error.message
        });
    }
}


