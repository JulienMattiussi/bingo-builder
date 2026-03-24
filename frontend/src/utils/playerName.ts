import config from "../config";

const PLAYER_NAME_KEY = "bingo-player-name";
const MAX_PLAYER_NAME_LENGTH = config.playerNameMaxLength;

export const playerNameUtils = {
  // Validate player nickname format
  isValidName(name: string): boolean {
    // Only letters, digits, - and _
    // Maximum length from env variable
    const regex = new RegExp(`^[a-zA-Z0-9_-]{1,${MAX_PLAYER_NAME_LENGTH}}$`);
    return regex.test(name);
  },

  // Get player nickname from localStorage
  getPlayerName(): string {
    return localStorage.getItem(PLAYER_NAME_KEY) || "";
  },

  // Save player nickname to localStorage
  savePlayerName(name: string): boolean {
    if (name && this.isValidName(name)) {
      localStorage.setItem(PLAYER_NAME_KEY, name.trim());
      return true;
    }
    return false;
  },

  // Check if player nickname exists
  hasPlayerName(): boolean {
    return !!localStorage.getItem(PLAYER_NAME_KEY);
  },

  // Clear player nickname
  clearPlayerName(): void {
    localStorage.removeItem(PLAYER_NAME_KEY);
  },
};
