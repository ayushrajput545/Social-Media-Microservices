const logger = require('../utils/logger')
const {validationRegistration,validationLogin} = require('../utils/validation')
const User = require('../models/User')
const generateTokens = require('../utils/generateTokens')
const RefreshToken = require('../models/RefreshToken')

// user ragistration
exports.registerUser = async(req,res)=>{
    logger.info("Ragistration endpoint hits...")
    try{
        const{error} = validationRegistration(req.body);
        if(error){
            logger.warn("Validation Error", error.details[0].message)
            return res.status(400).json({
                success:false,
                message:error.details[0].message
            })
        }

        const {email , userName, password} = req.body;

        let user = await User.findOne({$or:[{email}, {userName}]}) // either of email or username present
        if(user){
            logger.warn("User already exists!")
            return res.status(404).json({
                success:false,
                message:"User already exist! Please login"
            })
        }

        user = await User.create({
            userName , email , password
        })
        logger.warn("User Sucessfully created: " , user._id)

        const {accessToken , refreshToken} = await generateTokens(user)
        return res.status(201).json({
            success:true,
            message:"User ragistred successfully",
            accessToken,
            refreshToken
        })

    }
    catch(err){
        logger.error('Registration Error Occurred')
        res.status(500).json({
            success:false,
            message:'Internal Server Error'
        })

    }
}

//user login
exports.login = async(req,res)=>{
    try{
        logger.info("Login endpoint hits...")
        const {error} = validationLogin(req.body)
        if(error){
            logger.warn("Validation Error", error.details[0].message)
            return res.status(400).json({
                success:false,
                message:error.details[0].message
            })
        }

        const{email , password}= req.body;
        const user = await User.findOne({email:email})
        if(!user){
            logger.warn("Invalid User")
            return res.status(404).json({
                success:false,
                message:"User not exist! Please signup"
            })
        }

        const isValidPassword = await user.comparePassword(password)
        if(!isValidPassword){
            logger.warn("Invalid Password")
            return res.status(404).json({
                success:false,
                message:"Password Invalid"
            })
        }

        const {accessToken , refreshToken} = await generateTokens(user)
        return res.status(201).json({
            success:true,
            message:"Login Successfull",
            userId: user._id,
            accessToken,
            refreshToken
        })

    }
    catch(err){
        logger.error('Login Error Occurred')
        res.status(500).json({
            success:false,
            message:'Internal Server Error'
        })

    }
}

//refresh Token 
exports.refreshTokenUser = async(req,res)=>{
  try{

    const {refreshToken} = req.body();
    if(!refreshToken){
        logger.warn("Refresh TOken missing")
        return res.status(400).json({
            success:false,
            message:"Token missing"
        })
    }

    const storedToken = await RefreshToken.findOne({token:refreshToken})
    if(!storedToken || storedToken.expiresAt < new Date()){
        return res.status.json({
            success:false,
            message:"Invalid or expires refresh token"
        })
    }

    const user = await User.findById(storedToken.user)
    if(!user){
        return res.status(401).json({
        success:false,
        message:"User not found"
    })
    }

    const {accessToken:newAccessToken , refreshToken:newRefreshToken} = await generateTokens();

    //delete old token
    await RefreshToken.deleteOne({id: storedToken._id})

    res.json({
        accessToken:newAccessToken,
        refreshToken:newRefreshToken
    })
 
  }
  catch(err){
    logger.error('RefreshToken Error Occurred',err)
    res.status(500).json({
        success:false,
        message:'Internal Server Error'
    })
  }
}

//logout
exports.logOut = async(req, res)=>{
    logger.warn("LogOut Endpoint Hits")
    try{
        const {refreshToken} = req.body;
        if(!refreshToken){
            logger.warn("Refresh TOken missing")
            return res.status(400).json({
                success:false,
                message:"Token missing"
            })
        }

        await RefreshToken.deleteOne({id:refreshToken._id})
        logger.warn("Refresh Token deleted for logout")
        res.json({
            success:true,
            message:"Refresh Token Deleted Sucessfully"
        })
    }
    catch(err){
        logger.error('Logout Error Occurred',err)
        res.status(500).json({
            success:false,
            message:'Internal Server Error'
        })
    }
}