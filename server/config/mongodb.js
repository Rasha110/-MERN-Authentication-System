//creating a func that will connect us with mongodb db
import mongoose from 'mongoose'
mongoose.connection.on("connected",()=>console.log("Database connected"))
const connectDB =async ()=>{
    await mongoose.connect(`${process.env.MONGO_URI}/mern-auth`)
}
export default connectDB;