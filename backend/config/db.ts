import mongoose from "mongoose";

const connectDB = async () => {
  try {
    // For E2E and unit tests, always use test database on separate port
    // This takes precedence over MONGODB_URI from .env file
    let dbUri;

    if (process.env.NODE_ENV === "test") {
      // Priority: MONGODB_TEST_URI > MONGODB_URI (if port 27018) > default test URI
      if (process.env.MONGODB_TEST_URI) {
        dbUri = process.env.MONGODB_TEST_URI;
      } else if (process.env.MONGODB_URI?.includes("27018")) {
        dbUri = process.env.MONGODB_URI;
      } else {
        dbUri = "mongodb://localhost:27018/bingo-test";
      }
    } else {
      dbUri = process.env.MONGODB_URI || "mongodb://localhost:27017/bingo";
    }

    const conn = await mongoose.connect(dbUri);
    console.log(
      `MongoDB Connected: ${conn.connection.host} (${conn.connection.name}) [ENV: ${process.env.NODE_ENV || "development"}]`,
    );
  } catch (error) {
    console.error(`Error: ${(error as Error).message}`);
    process.exit(1);
  }
};

export default connectDB;
