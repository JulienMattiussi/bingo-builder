const PLAYER_NAME_KEY = "bingo-player-name";
const MAX_PLAYER_NAME_LENGTH =
  Number(import.meta.env.VITE_PLAYER_NAME_MAX_LENGTH) || 10;

export const playerNameUtils = {
  // Validate player name format
  isValidName(name: string): boolean {
    // Only letters, digits, - and _
    // Maximum length from env variable
    const regex = new RegExp(`^[a-zA-Z0-9_-]{1,${MAX_PLAYER_NAME_LENGTH}}$`);
    return regex.test(name);
  },

  // Get player name from localStorage
  getPlayerName(): string {
    return localStorage.getItem(PLAYER_NAME_KEY) || "";
  },

  // Save player name to localStorage
  savePlayerName(name: string): boolean {
    if (name && this.isValidName(name)) {
      localStorage.setItem(PLAYER_NAME_KEY, name.trim());
      return true;
    }
    return false;
  },

  // Check if player name exists
  hasPlayerName(): boolean {
    return !!localStorage.getItem(PLAYER_NAME_KEY);
  },

  // Clear player name
  clearPlayerName(): void {
    localStorage.removeItem(PLAYER_NAME_KEY);
  },
};
