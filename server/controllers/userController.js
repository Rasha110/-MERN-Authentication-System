//to return user data when we send through API
import userModel from "../models/userModel.js";
export const getUserData=async(req,res)=>{
try{
//first find the user with user ID
const userId=req.userId; //this user id is added by middleware
//now add code to find the user in the db
const user=await userModel.findById(userId);
if(!user){
return res.json({success:false, message:"User not found"})
}
//if user is available with userId
res.json({success:true,userData:{
    name:user.name,
    isAccountVerified:user.isAccountVerified
}})
}catch(error){
return res.json({success:false, message:error.message})

}
}