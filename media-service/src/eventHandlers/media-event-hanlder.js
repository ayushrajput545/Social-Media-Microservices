const Media = require("../models/Media");
const logger = require("../utils/logger");
const { deleteMediaFromCloudinary } = require("../utils/mediaUploader");

exports.handlePostDeleted = async(event)=>{
    console.log(event, "eventeventvent");
    const{postId ,mediaIds} = event
    try{
        const mediaToDelete = await Media.find({_id:{$in:mediaIds}})  // one post have many mediaIds , $in means “find all documents whose _id is in this array”.

        for(const media of mediaToDelete){ // we need to delete all medias of that post so run for loop on every mediaIds array and delete them
            await deleteMediaFromCloudinary(media.publicId)  // delete from cludinary
            await Media.findByIdAndDelete(media._id) // delete from database
            logger.info(`Deleted media ${media._id} associated with deleted post ${postId}`)
        }

    }
    catch(err){
        logger.error("Error While deleting media in media service",err)
    }
}