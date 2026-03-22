import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import cardRoutes from "./routes/cards.js";
import peerRoutes from "./routes/peers.js";

// Only load .env file in non-test environments
// This prevents .env from overriding test environment variables
if (process.env.NODE_ENV !== "test") {
  dotenv.config();
}

const app = express();
const PORT = process.env.PORT || 3001;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/cards", cardRoutes);
app.use("/api/peers", peerRoutes);

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
