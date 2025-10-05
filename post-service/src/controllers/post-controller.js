const Post = require('../models/Post')
const logger = require('../utils/logger');
const { validationCreatePost } = require('../utils/validations');

//create post
exports.createPost = async(req,res)=>{
    logger.info("Create Post Endpoints Hits...")
    try{
        const{error} = validationCreatePost(req.body);
        if(error){
            logger.warn("Validation Error", error.details[0].message)
            return res.status(400).json({
                success:false,
                message:error.details[0].message
            })
        }

        const {content , mediaIds} = req.body;
        const newPost = new Post({
            user:req.user.userId,
            content,
            mediaIds: mediaIds ||[]
        })

        await newPost.save();

        return res.status(201).json({
            success:true,
            message:"Post Created sucessfully",
            newPost
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