//a middleware to get cookie so that we can have token and in tht token we have user id which we want to
//use in verify Email controller func
import jwt from 'jsonwebtoken'
const userAuth=async(req,res,next)=>{//after completing the code of userAuth func it will go NEXT to the controller func
    const {token}= req.cookies;
    if(!token){
        //if token not found
       return res.json({success:false, message:"Not Authorized. Login Again!"})
        }
//if token is available then we use try-catch
try{
//decode the token
const tokenDecode=jwt.verify(token,process.env.JWT_SECRET)
//it has the id this id in the req body with the property userId
if(tokenDecode.id){
req.userId = tokenDecode.id;
}
//if token decode id isnt available
else{
   return res.json({success:false, message:"Not Authorized. Login Again!"})   
}
next(); //it will got to controller func
}
catch(err){
return  res.json({success:false, message:err.message})

}
}
export default userAuth;