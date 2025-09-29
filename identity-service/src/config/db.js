const mongoose = require('mongoose')
require('dotenv').config();
const logger = require('../utils/logger')

const dbConnect = ()=>{

    mongoose.connect(process.env.DB_URL)
    .then(()=>logger.info("DB CONNECTION SUCESSFULL"))
    .catch((err)=>logger.error("Failed to connect db: " , err))
}

module.exports = dbConnect