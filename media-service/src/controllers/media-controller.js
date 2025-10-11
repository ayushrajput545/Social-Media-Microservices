const { config } = require('dotenv');
const logger = require('../utils/logger');
const { uploadMediaToCloudinary } = require('../utils/mediaUploader');
require('dotenv').config();
const Media = require('../models/Media')

exports.uploadMedia = async(req,res)=>{
    logger.info("Media endpoints hits...")
    try{
        if(!req.file){
            return res.status(404).json({
                success:false,
                message:"File Not Found! Pls upload file and try again"
            })
        }

        const {originalname ,mimetype , buffer  }=req.file;
        const userId = req.user.userId;

        logger.info(`File details: name=${originalname} , type=${mimetype}`);
        logger.info(`Uploading to cloudinary starting...`);

        const cloudinaryUploadResult = await uploadMediaToCloudinary(req.file , process.env.FOLDER_NAME , 1000 ,1000)
        logger.info(`Clodinary Upload Successful. Public Id:-${cloudinaryUploadResult.public_id}`)

        const newlyCreatedMedia= await Media.create({
            publicId: cloudinaryUploadResult.public_id,
            originalName:originalname,
            mimeType:mimetype,
            url:cloudinaryUploadResult.secure_url,
            userId
        })

        return res.status(201).json({
            success:true,
            mediaId:newlyCreatedMedia._id,
            url:newlyCreatedMedia.url,
            message:"Media uploaded successfull"
        })

    }
    catch(err){
        logger.error("Error Occured while media uploading...")
        return res.status(500).json({
            success:false,
            message:"Internal server error while uploading media to cloudinary...",
            error: err.message
        })
    }
}