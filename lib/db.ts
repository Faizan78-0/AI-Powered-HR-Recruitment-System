import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

export async function connectDB(){
  try {
    const mongoURI: string | undefined = process.env.MONGO_URI;

    if (!mongoURI) {
      throw new Error("MONGO_URI is not defined in environment variables.");
    }

    const conn = await mongoose.connect(mongoURI);

    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Error connecting to MongoDB:", error.message);
    } else {
      console.error("Unknown MongoDB connection error");
    }

    process.exit(1);
  }
};
