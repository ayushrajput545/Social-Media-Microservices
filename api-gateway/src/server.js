require('dotenv').config()
const express = require('express')
const cors = require('cors')
const Redis = require('ioredis')
const helmet = require('helmet')
const {rateLimit} = require('express-rate-limit')
const {RedisStore} = require('rate-limit-redis')
const logger = require('./utils/logger')
const proxy = require('express-http-proxy')
const errorHandler = require('./middleware/errorHandler')
const { auth } = require('./middleware/auth')

const app = express();
const PORT = process.env.PORT || 3000

const redisClient = new Redis(process.env.REDIS_URL)

//middlewares
app.use(helmet())
app.use(cors())
app.use(express.json()) //parsing JSON request bodies.
app.use((req,res,next)=>{  //Logs every incoming request (method, URL, and body), Useful for debugging and monitoring.
    logger.info(`Recieved ${req.method} request to ${req.url}`)
    logger.info(`Request Body, ${req.body}`)
    next();
})

//rate limiting
const ratelimit = rateLimit({
    windowMs: 15*60*1000,  //crrent time window
    max:100, // max no of req it can do
    standardHeaders:true,
    legacyHeaders:false,
    handler:(req,res)=>{ // when limit is exceeded
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

app.use(ratelimit) //Apply rate-limiting middleware globally to all routes.


// create proxy
const proxyOptions = {
    proxyReqPathResolver: (req)=>{
        return req.originalUrl.replace(/^\/v1/, "/api") //Defines how to rewrite incoming paths (/v1/auth/... → /api/auth/...).
    },
    proxyErrorHandler:(err,res,next)=>{
        logger.error(`Proxy error: ${err.message}`)
        res.status(500).json({
            message:"Internal Server Error",
            error:err.message
        })
    }
}

//setting up proxy for our identity service (replacing v1 with api)
app.use('/v1/auth' , proxy(process.env.IDENTITY_SERVICE_URL , {
    ...proxyOptions,  //Proxies it to IDENTITY_SERVICE_URL (e.g., http://localhost:3001) , Incoming: /v1/auth/register , Outgoing: /api/auth/register 
    proxyReqOptDecorator:(proxyReqOpts , srcReq)=>{ //modifies request before forwarding (e.g., ensure JSON headers).
        proxyReqOpts.headers["Content-Type"] = "application/json"
        return proxyReqOpts;
    }, 
    userResDecorator:(proxyRes, proxyResData , userReq , userRes)=>{ //modifies/logs the response before sending back to client.
        logger.info(`Response received from Identity Service:${proxyRes.statusCode}`)
        return proxyResData;
    }
}))


//setting up proxy for post service
app.use('/v1/posts' ,auth ,  proxy(process.env.POST_SERVICE_URL , {
    ...proxyOptions,
    proxyReqOptDecorator:(proxyReqOpts , srcReq)=>{
        proxyReqOpts.headers["Content-Type"] = "application/json";
        proxyReqOpts.headers['x-user-id'] = srcReq.user.userId; //So the Post Service knows which user made the request, without decoding the JWT again.
        return proxyReqOpts
    },
    userResDecorator:(proxyRes, proxyResData , userReq , userRes)=>{ //modifies/logs the response before sending back to client.
        logger.info(`Response received from Post Service:${proxyRes.statusCode}`)
        return proxyResData;
    }

}))

// setting up proxy for media service
app.use('/v1/media' , auth , proxy(process.env.MEDIA_SERVICE_URL , {
    ...proxyOptions,
    proxyReqOptDecorator:(proxyReqOpts , srcReq)=>{
        proxyReqOpts.headers['x-user-id'] = srcReq.user.userId;
        /*
          Ensure the Content-Type is correctly set:
        - If the incoming request is *NOT* a file upload (`multipart/form-data`),
          then force the Content-Type to `application/json`.
        - This avoids corrupting file uploads by interfering with form data boundaries.
      */
        if(!srcReq.headers['content-type'].startsWith('multipart/form-data')){
            proxyReqOpts.headers["Content-Type"] = "application/json";
        }
        return proxyReqOpts
    },
    userResDecorator:(proxyRes, proxyResData , userReq , userRes)=>{ //modifies/logs the response before sending back to client.
        logger.info(`Response received from media Service:${proxyRes.statusCode}`)
        return proxyResData;
    },
    parseReqBody:false  //Without parseReqBody: false, the proxy would:Try to parse photo.jpg as text or JSON →  broken.

}))


//setting up proxy for search service
app.use('/v1/search' , auth , proxy(process.env.SEARCH_SERVICE_URL , {
    ...proxyOptions,
    proxyReqOptDecorator:(proxyReqOpts , srcReq)=>{
        proxyReqOpts.headers["Content-Type"] = "application/json";
        proxyReqOpts.headers['x-user-id'] = srcReq.user.userId; //So the Post Service knows which user made the request, without decoding the JWT again.
        return proxyReqOpts
    },
    userResDecorator:(proxyRes, proxyResData , userReq , userRes)=>{ //modifies/logs the response before sending back to client.
        logger.info(`Response received from Search Service:${proxyRes.statusCode}`)
        return proxyResData;
    }

}))

app.use(errorHandler)

app.listen(PORT , ()=>{
    logger.info(`Api Gateway is running at PORT:${PORT}`)
    logger.info(`Identity Service is running at PORT:${process.env.IDENTITY_SERVICE_URL}`)
    logger.info(`Post Service is running at PORT:${process.env.POST_SERVICE_URL}`)
    logger.info(`Media Service is running at PORT:${process.env.MEDIA_SERVICE_URL}`)
    logger.info(`Search Service is running at PORT:${process.env.SEARCH_SERVICE_URL}`)
    logger.info(`Redis URL:${process.env.REDIS_URL}`)
})
