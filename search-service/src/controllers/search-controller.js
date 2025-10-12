const logger = require("../utils/logger")
const Search = require('../models/Search')

exports.searchPost = async(req,res)=>{
    logger.info("Search endpoints hits...")
    try{

        const{query} = req.query;
        const result = await Search.find(
            {
                $text:{$search:query} //It searches the given string (query) in text-indexed fields of the Search collection.
            },
            {
                score:{$meta:"textScore"} //special MongoDB feature that returns the relevance score of each document (how closely it matches the search query).
            }
        ).sort({score:{$meta:"textScore"}}).limit(10) //This sorts the search results by their text match relevance (higher score = better match), This limits the result set to only the top 10 matching documents.

        res.json(result)

    }
    catch(err){
        return res.status(500).json({
            sucess:false,
            message:"Internal Server Error",
            error:err.message
        })

    }
}