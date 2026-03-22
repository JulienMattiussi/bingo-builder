const PLAYER_NAME_KEY = "bingo-player-name";

export const playerNameUtils = {
  // Validate player name format
  isValidName(name: string): boolean {
    // Only letters, digits, - and _
    // Maximum 10 characters
    const regex = /^[a-zA-Z0-9_-]{1,10}$/;
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
