const logger = require('../utils/logger')
const jwt = require('jsonwebtoken')
require('dotenv').config()

exports.auth = async(req,res,next)=>{
    try{

        const token = req.header("Authorization").replace("Bearer ","")

        if(!token){
            return res.status(404).json({
                success:false,
                message:"Token Missing"
            })
        }

        try{
            const decode = jwt.verify(token , process.env.JWT_SECRET)
            req.user = decode

        }
        catch(err){
            logger.error("Invalid Token")
            return res.status(404).json({
                success:false,
                message:"Invalid Token"
            })
            
        }
        next();
    }
    catch(err){
        logger.error("Error Ocurred while verifying token")
        return res.status(500).json({
            success:false,
            message:"Internal Server Error",
            error:err.message
        })

    }
}