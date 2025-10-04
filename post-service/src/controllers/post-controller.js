const Post = require('../models/Post')
const logger = require('../utils/logger')

//create post
exports.createPost = async(req,res)=>{
    try{

        const {content , mediaIds} = req.body;
        const newPost = new Post({
            user:req.user.userId,
            content,
            mediaIds: mediaIds ||[]
        })

        await newPost.save();

        return res.status(201).json({
            success:true,
            message:"Post Created sucessfully"
        })

    }
    catch(err){
        logger.error("Error Occured in Creating Post", err)
        return res.status(500).json({
            success:false,
            message:"Internal Server Error",
            error:err.message
        })
    }
}

//getAllPost
exports.getAllPosts = async(req,res)=>{
    try{



    }
    catch(err){
        logger.error("Error Occured while fetching Posts", err)
        return res.status(500).json({
            success:false,
            message:"Internal Server Error",
            error:err.message
        })
    }
}

//deleting post
exports.getAllPosts = async(req,res)=>{
    try{


    }
    catch(err){
        logger.error("Error Occured while fetching Posts", err)
        return res.status(500).json({
            success:false,
            message:"Internal Server Error",
            error:err.message
        })
    }
}