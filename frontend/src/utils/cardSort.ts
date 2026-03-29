import { Card } from "../types/models";

export interface CardProgress {
  played: boolean;
  completed: boolean;
}

/**
 * Calculate card completion percentage based on filled tiles
 */
export const getCompletionPercentage = (card: Card): number => {
  const filledTiles = card.tiles.filter((t) => t.value.trim()).length;
  return filledTiles / card.tiles.length;
};

/**
 * Calculate the number of checked tiles for a card
 * @param cardId - The card ID
 * @returns Number of checked tiles
 */
const getCheckedTilesCount = (cardId: string): number => {
  // Get checked tiles from localStorage
  const storageKey = `bingo-progress-${cardId}`;
  const savedProgress = localStorage.getItem(storageKey);
  if (savedProgress) {
    try {
      const progress = JSON.parse(savedProgress);
      return progress.checkedTiles?.length || 0;
    } catch {
      return 0;
    }
  }
  return 0;
};

/**
 * Sort cards by completion status and level:
 * 1. Uncompleted cards (not won) sorted by number of checked tiles (descending - most checked first)
 * 2. Completed cards (won) - listed last
 *
 * Note: Others' unpublished cards should be filtered out before calling this function
 *
 * @param cards - Array of cards to sort
 * @param currentUserId - ID of the current user
 * @param getCardProgress - Function that returns progress info for a card (played, completed)
 * @returns Sorted array of cards
 */
export const sortCardsByPriority = (
  cards: Card[],
  _currentUserId: string,
  getCardProgress: (cardId: string, totalTiles: number) => CardProgress,
): Card[] => {
  return [...cards].sort((a, b) => {
    const aProgress = getCardProgress(a._id, a.tiles.length);
    const bProgress = getCardProgress(b._id, b.tiles.length);

    // Priority 1: Uncompleted cards come before completed cards
    const aCompleted = aProgress.completed;
    const bCompleted = bProgress.completed;

    if (aCompleted && !bCompleted) return 1; // a is completed, push to end
    if (!aCompleted && bCompleted) return -1; // b is completed, push to end

    // If both are completed or both are uncompleted, sort by checked tiles count
    const aCheckedCount = getCheckedTilesCount(a._id);
    const bCheckedCount = getCheckedTilesCount(b._id);

    // Sort by checked tiles descending (most checked first)
    return bCheckedCount - aCheckedCount;
  });
};
