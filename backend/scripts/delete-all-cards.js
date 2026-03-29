// Script to delete all cards from the database
// Run with: npm run delete-all-cards
// Or: make db-clean-all

import mongoose from "mongoose";
import dotenv from "dotenv";
import Card from "../models/Card.js";

dotenv.config();

async function deleteAllCards() {
  try {
    // Connect to the database
    const dbUri =
      process.env.MONGODB_URI || "mongodb://localhost:27017/bingo-builder";
    console.log(`Connecting to ${dbUri}...`);
    await mongoose.connect(dbUri);
    console.log("✅ Connected to database");

    // Count cards
    const count = await Card.countDocuments();
    console.log(`\n📊 Found ${count} card(s) in database`);

    if (count === 0) {
      console.log("  (No cards to delete)");
    } else {
      // Delete all cards
      const result = await Card.deleteMany({});
      console.log(`\n🧹 Deleted ${result.deletedCount} card(s)`);
    }

    await mongoose.connection.close();
    console.log("\n✅ Database cleaned - all cards removed");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

deleteAllCards();
