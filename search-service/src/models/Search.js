const mongoose = require('mongoose')

const searchSchema = new mongoose.Schema({

    postId:{
        type:String,
        required:true,
        unique:true
    },
    userId:{
        type:String,
        required:true,
        index:true
    },
    content:{  // we search post based on content
        type:String,
        required:true
    },
    createdAt:{
        type:Date,
        default:Date.now()
    }

}, {timestamps:true})

searchSchema.index({content:"text"}) // search based on content
searchSchema.index({createdAt:-1}) // search based on content

module.exports = mongoose.model('Search' , searchSchema);