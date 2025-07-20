//basic express app
import express from "express"
import cors from "cors";
import 'dotenv/config';
import cookieParser from "cookie-parser"
import connectDB from "./config/mongodb.js";
import authRouter from "./routes/authRoutes.js"
import userRouter from "./routes/userRoutes.js";




connectDB()
const app=express();
app.use(express.json());
const port =process.env.port || 4000;

const allowedOrigins = [
  'http://localhost:5173',

  'https://mern-authentication-system-hbp2-lmn5suxqf-rasha110s-projects.vercel.app/' //  new Vercel frontend
];

app.use(cookieParser());
app.use(cors({origin: allowedOrigins,credentials:true})) //so we can send the cookies in the response from express app
//API endpoints
app.get("/",(req,res)=>res.send("Api is working"));
app.use('/api/auth',authRouter)
app.use('/api/user',userRouter)
app.listen(port,()=> console.log(`server started on port ${port}`))

//{"email": "bsf2101022@ue.edu.pk","password": "bob"}