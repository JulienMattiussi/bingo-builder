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
