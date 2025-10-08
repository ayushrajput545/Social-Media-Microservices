const express = require('express');
const auth = require('../middleware/auth');
const { uploadMedia } = require('../controllers/media-controller');
const multer = require('multer');
const logger = require('../utils/logger');
const router = express.Router();


//setup multer
const upload = multer({
    storage:multer.memoryStorage(),
    limit:{
        filesize:5 * 1024 * 1024 //5MB
    }
}).single('file')


router.post('/upload-media',auth , (req,res,next)=>{
    upload(req,res,function(err){
        if(err instanceof multer.MulterError){
            logger.error('Multer Error Occurred While uploading...', err)
            return res.status(400).json({
                messgae:'Multer Error Occured while uploading...',
                error:err.message,
                stack:err.stack
            })
        }
        else if(err){
            logger.error('Unknown Error Occurred While uploading...', err)
            return res.status(500).json({
                messgae:'Internal Server Error',
                error:err.message,
                stack:err.stack
            })
        }

           if(!req.file){
             return res.status(404).json({
                messgae:'File Not FOund',
            })     
        }
        next();
    })

},  uploadMedia)

module.exports = router