import mongoose from "mongoose";
import config from "./config.js";

const connectDB = async () => {
  try {
    // Use MONGODB_URI from environment file (.env or .env.test)
    const dbUri = config.get("database.uri");

    const conn = await mongoose.connect(dbUri);
    console.log(
      `MongoDB Connected: ${conn.connection.host} (${conn.connection.name}) [ENV: ${config.get("env")}]`,
    );
  } catch (error) {
    console.error(`Error: ${(error as Error).message}`);
    process.exit(1);
  }
};

export default connectDB;
