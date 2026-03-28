/**
 * User ID utility - Manages a secret unique identifier for each user
 * This ID is used for ownership verification and is never shared with other users
 */

const USER_ID_KEY = "bingo-user-id";

// Generate a UUID v4
function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export const userIdUtils = {
  /**
   * Get or create user ID
   * If user ID doesn't exist in localStorage, generate a new one
   * This ID persists across sessions and is never changed
   */
  getUserId(): string {
    let userId = localStorage.getItem(USER_ID_KEY);
    if (!userId) {
      userId = generateUUID();
      localStorage.setItem(USER_ID_KEY, userId);
    }
    return userId;
  },

  /**
   * Check if user ID exists
   */
  hasUserId(): boolean {
    return !!localStorage.getItem(USER_ID_KEY);
  },

  /**
   * Get existing user ID without creating a new one
   * Returns null if no user ID exists
   */
  getExistingUserId(): string | null {
    return localStorage.getItem(USER_ID_KEY);
  },

  /**
   * Clear user ID (use with caution - user will lose access to their cards)
   */
  clearUserId(): void {
    localStorage.removeItem(USER_ID_KEY);
  },
};
