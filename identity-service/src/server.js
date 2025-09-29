const express = require('express');
const dbConnect = require('./config/db');
const redisConnect = require('./config/redisClient')
const app = express();
const helmet = require('helmet')
const cors = require('cors')
const{RateLimiterRedis} = require('rate-limiter-flexible')
const rateLimit = require("express-rate-limit");
const {RedisStore} = require('rate-limit-redis')
const identityRoutes = require('./routes/identity-routes')
const errorHandler = require('./middleware/errorHandler')
require('dotenv').config()
const logger = require('./utils/logger')

//connect to db
dbConnect();
const redisClient = redisConnect();
const PORT = process.env.PORT || 3001


//middlewares
app.use(helmet()) //Helmet is like a security guard for your Express app. It automatically sets safe HTTP headers and reduces common web vulnerabilities.
app.use(cors())
app.use(express.json()) // parse our json

app.use((req,res,next)=>{
    logger.info(`Recieved ${req.method} request to ${req.url}`)
    logger.info(`Request Body, ${req.body}`)
    next();
})

//DDod Protection and Rate limiting (Here in redis)
const rateLimiter = new RateLimiterRedis({
    storeClient:redisClient,
    keyPrefix:'middleware',
    points:10,
    duration:1
})
app.use((req,res,next)=>{
    rateLimiter.consume(req.ip).then(()=>next()).catch(()=>{
        logger.warn(`Rate Limit exceeded for IP:${req.ip}`)
        return res.status(429).json({
            success:false,
            message:"Too Many requests"
        })
    })
})


//IP Based rate limit for sensitive endpoints : express rate limit 
const sensitiveEndpointsLimiter = rateLimit({
    windowMs: 15*60*1000,  //crrent time window
    max:50, // max no of req it can do
    standardHeaders:true,
    legacyHeaders:false,
    handler:(req,res)=>{
        logger.warn(`Sensitive endpoint rate limit exceeded for IP: ${req.ip}`)
        return res.status(429).json({
            success:false,
            message:"Too Many requests"
        })
    },
    store:new RedisStore({
        sendCommand:(...args)=>redisClient.call(...args),
    })
})

//apply this sensitive endpoint limiter ro our routes -> anyone can hit these enpoints too many times then this block the req
app.use('/api/auth/register', sensitiveEndpointsLimiter)

//Routes
app.use('/api/auth', identityRoutes)

//error Handler
app.use(errorHandler)

//listen server
app.listen(PORT , ()=>{
    logger.info(`Identity Service is Running at PORT:${PORT}`)
})

//unhandled promise rejection
process.on('unhandledRejection',(reason , promise)=>{
    logger.error('Unhandled Rejection at:', promise , "reason:" , reason)
})