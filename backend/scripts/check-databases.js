import mongoose from "mongoose";

const checkDatabase = async (uri, dbName) => {
  try {
    await mongoose.connect(uri);
    const Card = mongoose.model(
      "Card",
      new mongoose.Schema({}, { strict: false }),
      "cards",
    );

    const testCards = await Card.find({
      $or: [{ playerName: "TestPlayer" }, { playerName: "E2EPlayer" }],
    });

    console.log(`\n📊 ${dbName}:`);
    console.log(`   URI: ${uri}`);
    console.log(`   Test cards found: ${testCards.length}`);

    if (testCards.length > 0) {
      testCards.forEach((card) => {
        console.log(`   - "${card.title}" by ${card.playerName}`);
      });
    }

    await mongoose.connection.close();
  } catch (error) {
    console.error(`❌ Error checking ${dbName}:`, error.message);
  }
};

(async () => {
  console.log("🔍 Checking databases for test data...\n");

  // Check dev database
  await checkDatabase(
    "mongodb://localhost:27017/bingo-builder",
    "DEV Database",
  );

  // Check test database
  await checkDatabase("mongodb://localhost:27018/bingo-test", "TEST Database");

  console.log("\n✅ Check completed\n");
  process.exit(0);
})();
