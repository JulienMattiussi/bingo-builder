import mongoose from "mongoose";

async function globalSetup() {
  console.log("\n🧹 Cleaning test database before E2E tests...");

  try {
    // Connect to the test database on separate port
    const testDbUri =
      process.env.MONGODB_URI || "mongodb://localhost:27018/bingo-test";
    await mongoose.connect(testDbUri);

    // Drop the entire test database to ensure clean state
    await mongoose.connection.dropDatabase();
    console.log("✅ Test database cleaned successfully");

    // Close the connection
    await mongoose.connection.close();
  } catch (error) {
    console.error("❌ Failed to clean test database:", error);
    // Don't fail the tests if cleanup fails (database might not exist yet)
  }
}

export default globalSetup;
