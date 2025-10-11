const Joi = require('joi')

const validationCreatePost = (data)=>{
    const schema = Joi.object({
        content: Joi.string().required(),
        mediaIds:Joi.array() 
  
    })

return schema.validate(data);

}

module.exports = {validationCreatePost}