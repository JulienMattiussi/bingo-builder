import mongoose from "mongoose";
import dotenv from "dotenv";
import Card from "../models/Card.js";

dotenv.config();

async function cleanTestData() {
  try {
    // Connect to the production database
    const dbUri = process.env.MONGODB_URI || "mongodb://localhost:27017/bingo";
    console.log(`Connecting to ${dbUri}...`);
    await mongoose.connect(dbUri);
    console.log("✅ Connected to database");

    // Find all cards created by test users
    const testUserPatterns = ["TestPlayer", "TestUser", "E2EPlayer"];
    const query = {
      createdBy: { $in: testUserPatterns },
    };

    const testCards = await Card.find(query);
    console.log(`\n📊 Found ${testCards.length} test card(s) to remove:`);

    if (testCards.length > 0) {
      testCards.forEach((card) => {
        console.log(
          `  - "${card.title}" by ${card.createdBy} (ID: ${card._id})`,
        );
      });

      // Delete test cards
      const result = await Card.deleteMany(query);
      console.log(`\n🧹 Deleted ${result.deletedCount} test card(s)`);
    } else {
      console.log("  (No test cards found)");
    }

    await mongoose.connection.close();
    console.log("\n✅ Cleanup completed");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

cleanTestData();
