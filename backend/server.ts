import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import * as OpenApiValidator from "express-openapi-validator";
import mongoose from "mongoose";
import connectDB from "./config/db.js";
import cardRoutes from "./routes/cards.js";
import peerRoutes from "./routes/peers.js";
import config from "./config/config.js";
import { apiLimiter } from "./middleware/rateLimiter.js";

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

// OpenAPI validation middleware
app.use(
  OpenApiValidator.middleware({
    apiSpec: path.join(__dirname, "openapi.yaml"),
    validateRequests: true, // Validate request bodies, params, queries
    validateResponses: false, // Disable response validation in production (performance)
    validateApiSpec: true, // Validate the spec file itself
    $refParser: {
      mode: "dereference",
    },
  }),
);

// Apply general rate limiting to all API routes
app.use("/api/", apiLimiter);

// Routes
app.use("/api/cards", cardRoutes);
app.use("/api/peers", peerRoutes);

// Health check (no rate limit)
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Status endpoint with detailed system information (no rate limit)
app.get("/api/status", (_req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStatus =
    dbState === 1
      ? "connected"
      : dbState === 2
        ? "connecting"
        : dbState === 3
          ? "disconnecting"
          : "disconnected";

  const status = {
    status: dbState === 1 ? "ok" : "degraded",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.get("env"),
    database: {
      status: dbStatus,
      name: mongoose.connection.name || "unknown",
      host: mongoose.connection.host || "unknown",
    },
    version: "1.0.0", // Could import from package.json if needed
  };

  const httpStatus = dbState === 1 ? 200 : 503;
  res.status(httpStatus).json(status);
});

// OpenAPI validation error handler
app.use(
  (
    err: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    // OpenAPI validation error
    if (
      err &&
      typeof err === "object" &&
      "status" in err &&
      typeof err.status === "number"
    ) {
      return res.status(err.status).json({
        message: "message" in err ? err.message : "Validation error",
        errors: "errors" in err ? err.errors : undefined,
      });
    }
    // Other errors
    return res.status(500).json({
      message: "Internal server error",
    });
  },
);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
