/**
 * Reset Super Admin Password Script
 *
 * This script resets the super admin password to the default value or a provided password.
 *
 * Usage:
 *   npm run reset-superadmin
 *   npm run reset-superadmin -- newpassword123
 *
 * The script will:
 * - Connect to the database
 * - Find or create the super admin account
 * - Reset the password to default (from SUPERADMIN_DEFAULT_PASSWORD in .env) or provided value
 * - Update lastChanged timestamp
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

// Import SuperAdmin model (must be after dotenv config)
import SuperAdmin from "../models/SuperAdmin.js";

const DEFAULT_PASSWORD = process.env.SUPERADMIN_DEFAULT_PASSWORD;

if (!DEFAULT_PASSWORD) {
  console.error("❌ SUPERADMIN_DEFAULT_PASSWORD not set in .env file");
  process.exit(1);
}

async function resetPassword() {
  try {
    // Get new password from command line or use default
    const newPassword = process.argv[2] || DEFAULT_PASSWORD;

    if (newPassword.length < 8) {
      console.error("❌ Password must be at least 8 characters long");
      process.exit(1);
    }

    // Connect to MongoDB
    const mongoUri =
      process.env.MONGODB_URI || "mongodb://localhost:27017/bingo-builder";
    console.log(`Connecting to: ${mongoUri}`);

    await mongoose.connect(mongoUri);
    console.log("✅ Connected to MongoDB");

    // Find or create super admin
    let admin = await SuperAdmin.findOne();

    if (!admin) {
      console.log("📝 No super admin found, creating new one...");
      admin = new SuperAdmin({
        password: newPassword,
        lastChanged: new Date(),
      });
    } else {
      console.log("📝 Super admin found, updating password...");
      admin.password = newPassword;
      admin.lastChanged = new Date();
    }

    // Save (password will be hashed by pre-save hook)
    await admin.save();

    console.log("✅ Super admin password has been reset successfully");
    console.log(
      `📌 New password: ${newPassword === DEFAULT_PASSWORD ? "DEFAULT (from .env)" : "CUSTOM"}`,
    );
    console.log("⚠️  Remember to change the default password in production!");
  } catch (error) {
    console.error("❌ Error resetting password:", error);
    process.exit(1);
  } finally {
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log("👋 Disconnected from MongoDB");
  }
}

// Run the script
resetPassword();
