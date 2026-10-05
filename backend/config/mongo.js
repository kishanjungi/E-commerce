import mongoose from "mongoose";
import 'dotenv/config';

const connectDB = async () => {

  mongoose.connection.on('connected', () => {
    console.log('DB connected');
  })
  await mongoose.connect(`${process.env.MONGO_URI}`)



}

export default connectDB;