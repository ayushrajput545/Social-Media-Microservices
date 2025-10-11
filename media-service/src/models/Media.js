const mongoose = require('mongoose')

const mediaSchema = new mongoose.Schema({
    publicId:{  // we need this to delete media from cloudinary
        type:String,
        required:true
    },
    originalName:{
        type:String,
        required:true
    },
    mimeType:{
        type:String,
        required:true
    },
    url:{
        type:String,
        required:true
    },
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    }
}, {timestamps:true})

module.exports = mongoose.model('Media', mediaSchema);