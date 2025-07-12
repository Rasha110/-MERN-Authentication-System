//here we create login,resetpassword etc controller functions and usingt hat controller func we craete API endpoint
import bcrypt from 'bcryptjs'  // we need our password to be encrypted so use bycrypt
import jwt from 'jsonwebtoken'
import userModel from '../models/userModel.js';
import transporter from '../config/nodemailer.js';
import { EMAIL_VERIFY_TEMPLATE,PASSWORD_RESET_TEMPLATE } from '../config/emailTemplates.js';

export const register=async(req,res)=>{
const {name,email,password}=req.body; // we need our password to be encrypted so use bycrypt
if(!name || !email || !password){
    return res.json({success:false, message:"Missing Details"})
}
try{
    
    const existingUser= await userModel.findOne({email}); //this will check if user exist with corresponding email
    if(existingUser){
        return res.json({success:false, message:"User aalready exists"})
    }
//if all credentials found, nothing is missing then below line is execyted that is enccryptinh users password
const hashedPassword=await bcrypt.hash(password,10);
//now we will create and  save user in database
const user=new userModel({name,email,password:hashedPassword});
await user.save();
//now we will create token fro authentication 
const token=jwt.sign({id:user._id},process.env.JWT_SECRET,{expiresIn:'7d'}); //now we will send this token in response and response will add in the cookie
res.cookie('token', token,{
    httpOnly:true,
    secure: process.env.NODE_ENV==='production',
    sameSite:process.env.NODE_ENV==='production' ? 'none' :'strict',maxAge:7*24*60*60*1000
    //this will be true for dev and false for prod env true for http false for httpss

})
//sending welcome email
const mailOptions={
    from:process.env.SENDER_EMAIL,
    to:email,
    subject:'Congratulations you are selected as graphic designer',
    text: ` Congratulations you are selected as graphic designer. Welcome to GreatStack website. Your account has been created! with email id: ${email} `
}
await transporter.sendMail(mailOptions);
console.log(process.env.SENDER_EMAIL)
return res.json({success:true})

}catch(error){
    res.json({success:false, message:error.message})
}
}
export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.json({ success: false, message: "Email and password are required" });
  }

  try {
    const user = await userModel.findOne({ email });

    if (!user) {
      return res.json({ success: false, message: "Invalid email" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.json({ success: false, message: "Invalid password" });
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res.json({ success: true, message: "Login successful" });

  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

export const logout=async(req,res)=>{
    try{
// just cleear cookie from the response, and provide cookie name that is token
res.clearCookie('token',{
    httpOnly:true,
    secure: process.env.NODE_ENV==='production',
    sameSite:process.env.NODE_ENV==='production' ? 'none' :'strict',maxAge:7*24*60*60*1000
    //this will be true for dev and false for prod env true for http false for httpss

});
return res.json({success:true, message:"Logged Out!"})
    }
    catch(error){
 res.json({success:false, message:error.message})

    }
}

//sending email for verification OTP
export const sendVerifyOtp=async(req,res)=>{
  try{
const userId = req.userId; //we can access this userId from token and that token comes from cookie, we need a middleware that will get the cookie
const user=await userModel.findById(userId);
if(user.isAccountVerified){
  return res.json({success:false, message:"Account already verified"})
}
const otp = String(Math.floor(100000 + Math.random() * 900000));
user.verifyOtp =otp; //store this otp in db
user.verifyOtpExpireAt=Date.now()+ 24*60*60*1000;
await user.save(); //save user in db
const mailOptions={
    from:process.env.SENDER_EMAIL,
    to:user.email,
    subject:'Account Verification OTP',
    text: ` Your OTP is ${otp}. Verify your account using this OTP.`,
    html: EMAIL_VERIFY_TEMPLATE.replace("{{otp}}",otp).replace("{{email}}",user.email)
}
//to send mail
await transporter.sendMail(mailOptions);
//adding response POSTMAN
res.json({success:true,message: "Verification OTP sent on Email"})
}
  catch(error){
 res.json({success:false, message:error.message})
  }
}

export const verifyEmail= async(req,res)=>{
 const { otp } = req.body;
const userId = req.userId;  // ✅ get from middleware

if(!userId || !otp){ //if any of data isnt available
  return res.json ({ success: false, message:"Missing details"})
}
//if both data is available
try{
const user=await userModel.findById(userId);
if(!user){
  //if there is no user of that id
  return res.json({success:false,message:'USer not found'});
}
//if user is available
if(user.verifyOtp ===''|| user.verifyOtp!=otp){
return res.json({success:false,message:'Invalid OTP'})
}
if (user.verifyOtpExpireAt<Date.now()){
  return res.json({success:false,message:'OTP expired'})

}
user.isAccountVerified=true;
user.verifyOtp='';
user.verifyOtpExpireAt=0;
await user.save();
return res.json({success:true,message:'Email verified successfully'})
}
catch(error){
   return res.json({success:false, message:error.message})

}
}

//user is already logged in or not
export const isAuthenticated = (req, res) => {
  if (req.userId) {
    return res.json({ success: true });
  } else {
    return res.json({ success: false });
  }
};
//send password reset otp
export const sendResetOtp=async(req,res)=>{
  const {email}=req.body; //getting email id
  if(!email){
    return res.json({success:false,message:"email is required"})
  }
try{
  //find the user by given email id
  const user=await userModel.findOne({email});
if(!user){
  return res.json({success:false,message:'user not found'})

}
const otp = String(Math.floor(100000 + Math.random() * 900000));
user.resetOtp =otp; //store this otp in db
user.resetOtpExpireAt=Date.now()+ 15*60*60*1000;
await user.save(); //save user in db
const mailOptions={
    from:process.env.SENDER_EMAIL,
    to:user.email,
    subject:'Password Reset OTP',
    text: ` Your reset password OTP is ${otp}. reset your account using this OTP.`,
    html: PASSWORD_RESET_TEMPLATE.replace("{{otp}}",otp).replace("{{email}}",user.email)

}
await transporter.sendMail(mailOptions);
return res.json({success:true,message:"OTP sent to your email"})
}
catch(error){
return res.json({success:false, message:error.message})
}
}
//reset user password
export const resetpassword=async(req,res)=>{
  const {email,otp,newPassword}=req.body;
  if(!email || !otp || !newPassword){
    return res.json({success:false,message:"Email,OTP,New password is required!!"});
  }
  try{
const user=await userModel.findOne({email});
if(!user){
  return res.json({success:false,message:'user not found'})

}
if(user.resetOtp === ''|| user.resetOtp!==otp){
return res.json({success:false,message:'Invalid OTP'})

}
if(user.resetOtpExpireAt <Date.now()){
  return res.json({success:false,message:'OTP expired'})
}
//opt is valid then we have to encrypt the new password
const hashedPassword=await bcrypt.hash(newPassword,10);
//now update password in user db
user.password=hashedPassword;
user.resetOtp='';
user.resetOtpExpireAt=0;
await user.save();
  return res.json({success:true,message:'Password has been reset successfully!'})
  }
  catch(error){
    return res.json({success:false, message:error.message})
  }
}
