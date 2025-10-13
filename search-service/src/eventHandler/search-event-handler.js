const Search = require("../models/Search");
const logger = require("../utils/logger")

exports.handleCreatePost = async(event)=>{ // use/consume this handler in server.js 
    console.log(event)
    try{
        const{postId , userId , content , createdAt} = event;
        const newSearchPost = await Search.create({
            postId,
            userId,
            content,
            createdAt
        });

        logger.info(`New Search Post:${postId} created`)


    }
    catch(err){
        logger.error("Error while handling cretae post event", err)
    }

}

exports.hanldeDeletePost = async(event)=>{
    console.log(event)
    try{
        const{postId , userId} = event;
        await Search.findOneAndDelete({postId:postId});

        logger.info(`Post deleted successfully from Search`);

    }
    catch(err){
        console.log("Error occurres while deleting search post: ", err);

    }
}