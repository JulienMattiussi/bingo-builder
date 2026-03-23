import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";
import cardRoutes from "./routes/cards.js";
import peerRoutes from "./routes/peers.js";
import config from "./config/config.js";
import { apiLimiter } from "./middleware/rateLimiter.js";

const app = express();
const PORT = config.get("server.port");

// Connect to MongoDB
connectDB();

// CORS configuration - restrict to frontend origin only
const corsOptions = {
  origin: config.get("server.corsOrigin"),
  credentials: true, // Allow cookies/auth headers
  optionsSuccessStatus: 200,
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: "1mb" })); // Limit request body size

// Apply general rate limiting to all API routes
app.use("/api/", apiLimiter);

// Routes
app.use("/api/cards", cardRoutes);
app.use("/api/peers", peerRoutes);

// Health check (no rate limit)
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
