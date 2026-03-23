import rateLimit from "express-rate-limit";
import config from "../config/config.js";

// General API rate limiter
// Configurable via RATE_LIMIT_API_WINDOW_MS and RATE_LIMIT_API_MAX
export const apiLimiter = rateLimit({
  windowMs: config.get("rateLimit.apiWindowMs"),
  max: config.get("rateLimit.apiMaxRequests"),
  message: {
    message: "Too many requests from this IP, please try again later.",
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // Skip rate limiting in test environment
  skip: () => config.get("env") === "test",
});

// Stricter rate limiter for write operations (POST, PUT, DELETE)
// Configurable via RATE_LIMIT_WRITE_WINDOW_MS and RATE_LIMIT_WRITE_MAX
export const writeOperationsLimiter = rateLimit({
  windowMs: config.get("rateLimit.writeWindowMs"),
  max: config.get("rateLimit.writeMaxRequests"),
  message: {
    message:
      "Too many write operations from this IP, please try again after 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => config.get("env") === "test",
});

// Very strict rate limiter for peer registration/updates
// Configurable via RATE_LIMIT_PEER_WINDOW_MS and RATE_LIMIT_PEER_MAX
export const peerOperationsLimiter = rateLimit({
  windowMs: config.get("rateLimit.peerWindowMs"),
  max: config.get("rateLimit.peerMaxRequests"),
  message: {
    message: "Too many peer operations, please slow down.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => config.get("env") === "test",
});

// Aggressive rate limiter for card listing (prevent scraping)
// Configurable via RATE_LIMIT_LIST_WINDOW_MS and RATE_LIMIT_LIST_MAX
export const listOperationsLimiter = rateLimit({
  windowMs: config.get("rateLimit.listWindowMs"),
  max: config.get("rateLimit.listMaxRequests"),
  message: {
    message: "Too many list requests, please slow down.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => config.get("env") === "test",
});
