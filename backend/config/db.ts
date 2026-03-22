import mongoose from "mongoose";
import config from "./config.js";

const connectDB = async () => {
  try {
    // For E2E and unit tests, always use test database on separate port
    const dbUri =
      config.get("env") === "test"
        ? config.get("database.testUri")
        : config.get("database.uri");

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
