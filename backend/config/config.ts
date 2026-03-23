import convict from "convict";
import path from "path";
import { fileURLToPath } from "url";

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define configuration schema
const config = convict({
  env: {
    doc: "The application environment",
    format: ["production", "development", "test"],
    default: "development",
    env: "NODE_ENV",
  },
  server: {
    port: {
      doc: "The port to bind the server to",
      format: "port",
      default: 3001,
      env: "VITE_API_PORT",
    },
    corsOrigin: {
      doc: "Allowed CORS origin (frontend URL)",
      format: String,
      default: "http://localhost:3000",
      env: "CORS_ORIGIN",
    },
  },
  database: {
    uri: {
      doc: "MongoDB connection URI (determined by environment file: .env or .env.test)",
      format: String,
      default: "mongodb://localhost:27017/bingo-builder",
      env: "MONGODB_URI",
    },
  },
  limits: {
    cardTitleMaxLength: {
      doc: "Maximum length for card titles",
      format: "nat",
      default: 25,
      env: "VITE_CARD_TITLE_MAX_LENGTH",
    },
    tileMaxLength: {
      doc: "Maximum length for tile content",
      format: "nat",
      default: 40,
      env: "VITE_TILE_MAX_LENGTH",
    },
    playerNameMaxLength: {
      doc: "Maximum length for player names",
      format: "nat",
      default: 10,
      env: "VITE_PLAYER_NAME_MAX_LENGTH",
    },
    maxPlayersPerCard: {
      doc: "Maximum number of players per card",
      format: "nat",
      default: 6,
      env: "VITE_MAX_PLAYERS_PER_CARD",
    },
    maxPublishedCards: {
      doc: "Maximum number of published cards in the database",
      format: "nat",
      default: 50,
      env: "VITE_MAX_PUBLISHED_CARDS",
    },
    maxUnpublishedCards: {
      doc: "Maximum number of unpublished cards in the database",
      format: "nat",
      default: 50,
      env: "VITE_MAX_UNPUBLISHED_CARDS",
    },
  },
  rateLimit: {
    apiWindowMs: {
      doc: "Rate limit window for general API requests (milliseconds)",
      format: "nat",
      default: 900000, // 15 minutes
      env: "RATE_LIMIT_API_WINDOW_MS",
    },
    apiMaxRequests: {
      doc: "Maximum API requests per window",
      format: "nat",
      default: 100,
      env: "RATE_LIMIT_API_MAX",
    },
    writeWindowMs: {
      doc: "Rate limit window for write operations (milliseconds)",
      format: "nat",
      default: 900000, // 15 minutes
      env: "RATE_LIMIT_WRITE_WINDOW_MS",
    },
    writeMaxRequests: {
      doc: "Maximum write requests per window",
      format: "nat",
      default: 30,
      env: "RATE_LIMIT_WRITE_MAX",
    },
    peerWindowMs: {
      doc: "Rate limit window for peer operations (milliseconds)",
      format: "nat",
      default: 60000, // 1 minute
      env: "RATE_LIMIT_PEER_WINDOW_MS",
    },
    peerMaxRequests: {
      doc: "Maximum peer requests per window",
      format: "nat",
      default: 60,
      env: "RATE_LIMIT_PEER_MAX",
    },
    listWindowMs: {
      doc: "Rate limit window for list operations (milliseconds)",
      format: "nat",
      default: 60000, // 1 minute
      env: "RATE_LIMIT_LIST_WINDOW_MS",
    },
    listMaxRequests: {
      doc: "Maximum list requests per window",
      format: "nat",
      default: 20,
      env: "RATE_LIMIT_LIST_MAX",
    },
  },
});

// Load environment-specific configuration
const dotenv = await import("dotenv");
const dotenvPath =
  config.get("env") === "test"
    ? path.resolve(__dirname, "../../.env.test")
    : path.resolve(__dirname, "../../.env");

dotenv.config({ path: dotenvPath });

// Validate configuration
config.validate({ allowed: "strict" });

export default config;
