const Post = require('../models/Post')
const logger = require('../utils/logger');
const { validationCreatePost } = require('../utils/validations');


//delete redis keys: use this when we create new post or update any post or change data of any post then we must delete that post from cache
async function invalidatePostCache(req, input){
    const cachedKey = `post:${input}` // for deletepost
    await req.redisClient.del(cachedKey)

    const keys = await req.redisClient.keys("posts:*")
    if(keys.length>0){
        await req.redisClient.del(keys)
    }
}

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
        await invalidatePostCache(req , newPost._id.toString()) // every time you delete the post from redis when newly post is created

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
    logger.info("Get all Post Endpoint hits...")
    try{

        //do pagination 
        const page = parseInt(req.query.page) || 1; 
        const limit = parseInt(req.query.limit) || 10;
        const startIndex= (page-1) * limit;

        //do caching
        const cacheKey = `posts:${page}:${limit}`
        //const cacheKey = "posts:all"; -> do this if we dont want pagination // Since we are not paginating, all posts share the same cache key
        const cachedPosts = await req.redisClient.get(cacheKey) // as we pass post in redisclient in server.js

        if(cachedPosts){
            return res.json(JSON.parse(cachedPosts))
        }

        // if cachedPost not present in redist  we fetched them from DB
        const posts = await Post.find({}).sort({createdAt:-1}).skip(startIndex).limit(limit) 
        const totalPosts = await Post.countDocuments();

        const result={
            posts,
            currentPage:page,
            totalPages: Math.ceil(totalPosts/limit),
            totalPosts:totalPosts
        }

        // save your post in redis cache
        await req.redisClient.setex(cacheKey , 300 , JSON.stringify(result)) // store for 5 mintutes automatically deleted in 5 mins

        return res.json(result)
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

//get one post
exports.getPost = async(req,res)=>{
    try{

        const postId = req.params.id;
        const cacheKey = `post:${postId}`
        const cachedPost = await req.redisClient.get(cacheKey);

        if(cachedPost){
            return res.json(JSON.parse(cachedPost)); // cuz we store data in json string so we need to convert in json object
        }

        // if not found in cache
        const post = await Post.findById(postId)
        if(!post){
            return res.status(404).json({
                success:false,
                message:"Post Not Found"
            })
        }
        await req.redisClient.setex(cacheKey , 3600 , JSON.stringify(post)) // give it one hour
        return res.json(post)
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

exports.deletePost = async(req,res)=>{
    logger.info("Delete endpoint hits...")
    try{
        const postId = req.params.id;
        const userId = req.user.userId;
        const post = await Post.findOneAndDelete({_id:postId , user:userId});

        if(!post){
            return res.status(404).json({
                success:false,
                message:"Post Not Found"
            })
        }

        await invalidatePostCache(req, postId)

        return res.json({
            message:"Post Deleted successfully"
        })

    }
    catch(err){
        logger.error("Error Occured while deleting Post", err)
        return res.status(500).json({
            success:false,
            message:"Internal Server Error",
            error:err.message
        })
    }
}