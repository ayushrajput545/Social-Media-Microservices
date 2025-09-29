const{RateLimiterRedis} = require('rate-limiter-flexible')
require('dotenv').config();
const Redis = require('ioredis')
const logger = require('../utils/logger')

const redisConnect = ()=>{
    const redisClient = new Redis(process.env.REDIS_URL)

    redisClient.on("connect", ()=>{
        logger.info("Connect to redis")
    })

    redisClient.on("error" , ()=>{
        logger.error("Failed to Connext Redis")
    })
    return redisClient
}

module.exports = redisConnect