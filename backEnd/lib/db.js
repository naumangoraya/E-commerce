import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    console.log("Attempting to connect to MongoDB with URI:", process.env.MONGO_URI);
    const conn = await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/ecom");
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.log("Error in connection ", error.message);
    process.exit(1);
  }
};
