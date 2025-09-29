const jwt = require('jsonwebtoken')
require('dotenv').config()
const crypto = require('crypto')
const RefreshToken = require('../models/RefreshToken')

const generateTokens = async(user)=>{
    const accessToken = jwt.sign({
        userId:user._id,
        userName: user.userName
    }, process.env.JWT_SECRET , {expiresIn:"60m"}) // max 15min in production 

    const refreshToken = crypto.randomBytes(40).toString('hex')
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate()+7) // refresh token expires in 7 days

    await RefreshToken.create({
        token:refreshToken,
        user:user._id,
        expiresAt
    })

    return {accessToken , refreshToken}
}

module.exports = generateTokens