const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require('crypto');


const UserSchema = new mongoose.Schema({
    name:{
        type:String,
        required:[true, "Please enter a name"]
    },
    email:{
        type:String,
        required:[true, "please enter the email address"],
        unique:[true, "email already exits"]
    },
    password:{
        type:String,
        required:[true, "please enter the password"],
        minlength:[8, "password must be at least 8 characters"],
        select:false
    },
    bio:String,

    post:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:'Post',
        }
    ],
    followers:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:'User',
        }
    ],
    following:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:'User'
        }
    ],

    avatar:{
        public_id:{ type:String, required:true},
        url:{ type:String, required:true}
    }, 

    private:{type:Boolean, default:false},

    resetPasswordToken:String,
    resetPasswordExpire:Date,

});

//Encrypting password before saving user
UserSchema.pre('save', async function(next){
    if(this.isModified('password')){
        this.password = await bcrypt.hash(this.password, 10);
    }
    next();
    
})


UserSchema.methods.matchPassword = async function (password){
    return await bcrypt.compare(password, this.password);
}


UserSchema.methods.generateToken = async function(){
    return jwt.sign({_id:this._id}, process.env.JWT_SECRET);
}

UserSchema.methods.getResetPasswordToken = async function(){
    const resetToken = crypto.randomBytes(20).toString("hex");
    this.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    this.resetPasswordExpire = Date.now() + 10*60*1000;
    return resetToken;
}
module.exports = mongoose.model('User', UserSchema);


