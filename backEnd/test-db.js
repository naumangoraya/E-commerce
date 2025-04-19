import mongoose from "mongoose";
import User from "./models/user.model.js";

const MONGO_URI = "mongodb://localhost:27017/ecom";

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(MONGO_URI);
    console.log(`MongoDB connected: ${conn.connection.host}`);
    
    // Count users in the database
    const userCount = await User.countDocuments();
    console.log(`Number of users in database: ${userCount}`);
    
    // List all users
    const users = await User.find({}, { email: 1, name: 1, _id: 0 });
    console.log("Users in database:", users);
    
    mongoose.connection.close();
  } catch (error) {
    console.log("Error:", error);
  }
};

connectDB(); 