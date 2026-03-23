/**
 * Frontend configuration management
 * Validates and provides typed access to environment variables
 */

interface ConfigSchema {
  apiPort: number;
  port: number;
  limits: {
    cardTitleMaxLength: number;
    tileMaxLength: number;
    playerNameMaxLength: number;
    maxPlayersPerCard: number;
    maxPublishedCards: number;
    maxUnpublishedCards: number;
  };
}

class Config {
  private config: ConfigSchema;

  constructor() {
    // Parse and validate environment variables
    this.config = this.loadConfig();
    this.validate();
  }

  private loadConfig(): ConfigSchema {
    return {
      apiPort: this.parseNumber("VITE_API_PORT", 3001),
      port: this.parseNumber("VITE_PORT", 3000),
      limits: {
        cardTitleMaxLength: this.parseNumber("VITE_CARD_TITLE_MAX_LENGTH", 25),
        tileMaxLength: this.parseNumber("VITE_TILE_MAX_LENGTH", 40),
        playerNameMaxLength: this.parseNumber(
          "VITE_PLAYER_NAME_MAX_LENGTH",
          10,
        ),
        maxPlayersPerCard: this.parseNumber("VITE_MAX_PLAYERS_PER_CARD", 6),
        maxPublishedCards: this.parseNumber("VITE_MAX_PUBLISHED_CARDS", 50),
        maxUnpublishedCards: this.parseNumber("VITE_MAX_UNPUBLISHED_CARDS", 50),
      },
    };
  }

  private parseNumber(key: string, defaultValue: number): number {
    const value = import.meta.env[key];
    if (value === undefined || value === "") {
      return defaultValue;
    }
    const parsed = Number(value);
    if (isNaN(parsed)) {
      console.warn(
        `Invalid number for ${key}: "${value}". Using default: ${defaultValue}`,
      );
      return defaultValue;
    }
    return parsed;
  }

  private validate(): void {
    const errors: string[] = [];

    // Validate ports
    if (this.config.apiPort < 1 || this.config.apiPort > 65535) {
      errors.push(
        `API port must be between 1 and 65535, got ${this.config.apiPort}`,
      );
    }
    if (this.config.port < 1 || this.config.port > 65535) {
      errors.push(`Port must be between 1 and 65535, got ${this.config.port}`);
    }

    // Validate limits (must be positive integers)
    Object.entries(this.config.limits).forEach(([key, value]) => {
      if (!Number.isInteger(value) || value < 1) {
        errors.push(`${key} must be a positive integer, got ${value}`);
      }
    });

    if (errors.length > 0) {
      throw new Error(`Configuration validation failed:\n${errors.join("\n")}`);
    }
  }

  // Getter methods with type safety
  get apiPort(): number {
    return this.config.apiPort;
  }

  get port(): number {
    return this.config.port;
  }

  get apiUrl(): string {
    return `http://localhost:${this.config.apiPort}`;
  }

  get limits() {
    return { ...this.config.limits };
  }

  // Convenience getters for individual limits
  get cardTitleMaxLength(): number {
    return this.config.limits.cardTitleMaxLength;
  }

  get tileMaxLength(): number {
    return this.config.limits.tileMaxLength;
  }

  get playerNameMaxLength(): number {
    return this.config.limits.playerNameMaxLength;
  }

  get maxPlayersPerCard(): number {
    return this.config.limits.maxPlayersPerCard;
  }

  get maxPublishedCards(): number {
    return this.config.limits.maxPublishedCards;
  }

  get maxUnpublishedCards(): number {
    return this.config.limits.maxUnpublishedCards;
  }

  // Get entire config as readonly object
  getAll(): Readonly<ConfigSchema> {
    return Object.freeze(JSON.parse(JSON.stringify(this.config)));
  }
}

// Export singleton instance
const config = new Config();
export default config;
