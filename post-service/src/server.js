require('dotenv').config()
const express = require('express');
const dbConnect = require('./config/db');
const helmet = require('helmet')
const cors = require('cors')
const Redis = require('ioredis')
const rateLimit = require('express-rate-limit')
const {RedisStore} = require('rate-limit-redis')
const postRoutes = require('./routes/post-routes')
const errorHandler = require('./middleware/errorHandler')
const logger = require('./utils/logger');
const {connectionRabbitMQ} = require('./utils/rabbitmq');

const app = express();
const PORT = process.env.PORT || 3002
const redisClient = new Redis(process.env.REDIS_URL)
redisClient.on("connect", () => logger.info("Redis connected"));
redisClient.on("error", (err) => console.error("Redis error :", err.message));

//db connect
dbConnect();

//middlewares
app.use(helmet())
app.use(cors())
app.use(express.json())
app.use((req,res,next)=>{
    logger.info(`Recieved ${req.method} request to ${req.url}`)
    logger.info(`Request Body, ${req.body}`)
    next();
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
app.use('/api/posts/create-post', sensitiveEndpointsLimiter)


//routes: also pass our redis client
app.use('/api/posts',  (req,res,next)=>{ //Adds the redisClient to every request object (req.redisClient).
    req.redisClient = redisClient  //So inside your route files (post-routes.js), you can directly access Redis:
    next()
}, postRoutes)

app.use(errorHandler)


async function startServer(){
    try{
        await connectionRabbitMQ();
        app.listen(PORT , ()=>{
          logger.info(`Post Service is Running at PORT:${PORT}`)
        })

    }
    catch(err){
        logger.error('Failed to connect Server',err)
        process.exit(1)
    }
}
//listen server
startServer();

//unhandled promise rejection
process.on('unhandledRejection',(reason , promise)=>{
    logger.error('Unhandled Rejection at:', promise , "reason:" , reason)
})
