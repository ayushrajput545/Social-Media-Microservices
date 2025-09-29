const mongoose = require('mongoose')
const argon2 = require('argon2')

const userSchema = new mongoose.Schema({

    userName:{
        type:String,
        required:true,
        unique:true,
        trim:"true"
    },
    email:{
        type:String,
        required:true,
        unique:true,
        trim:"true",
        lowercase:true
    },
    password:{
        type:String,
        required:true
    },
    createdAt:{
        type:Date,
        default:Date.now()
    }
}, {timestamps:true})

// argon2 -> For password hashing (better than bcrypt, secure against GPU/brute force attacks)
userSchema.pre('save', async function(next){ //pre('save'): A Mongoose pre middleware hook that runs before saving a document to the database.
    if(this.isModified('password')){         //this: Refers to the current user document.
        try{                                 // this.isModified('password'): Ensures password is only hashed if it’s new or changed.
            this.password = await argon2.hash(this.password) // hash the password
        }
        catch(err){
            return next(err)
        }
    }
})

userSchema.methods.comparePassword = async function(candidatePassword){
    try{
        return await argon2.verify(this.password , candidatePassword)
    }
    catch(err){
        throw err
    }
}

userSchema.index({userName:'text'}); // search the document -> search document by index imporve the performence

module.exports = mongoose.model('User', userSchema);
