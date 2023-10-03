const mongoose=require('mongoose');

const userOtpSchema=new mongoose.Schema({
    email:{
        type:String,
        required:true,
        unique:true,
    },
    otp:{
        type:String,
        required:true
    }
},{timestamps:true}
)

const UserOtp=mongoose.model('USEROTP',userOtpSchema);
module.exports=UserOtp;