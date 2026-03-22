import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";
import cardRoutes from "./routes/cards.js";
import peerRoutes from "./routes/peers.js";
import config from "./config/config.js";

const app = express();
const PORT = config.get("server.port");

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
