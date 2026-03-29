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
 * Sort cards by priority:
 * 1. Cards I started but not won yet
 * 2. My unpublished cards (sorted by completion percentage, most complete first)
 * 3. My published cards
 * 4. Others' published cards
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
  currentUserId: string,
  getCardProgress: (cardId: string, totalTiles: number) => CardProgress,
): Card[] => {
  return [...cards].sort((a, b) => {
    const aOwner = a.ownerId === currentUserId;
    const bOwner = b.ownerId === currentUserId;
    const aProgress = getCardProgress(a._id, a.tiles.length);
    const bProgress = getCardProgress(b._id, b.tiles.length);

    // Priority 1: Cards I started but not won yet
    const aPlayedNotWon = aProgress.played && !aProgress.completed;
    const bPlayedNotWon = bProgress.played && !bProgress.completed;
    if (aPlayedNotWon && !bPlayedNotWon) return -1;
    if (!aPlayedNotWon && bPlayedNotWon) return 1;

    // Priority 2: My unpublished cards
    const aMyUnpublished = aOwner && !a.isPublished;
    const bMyUnpublished = bOwner && !b.isPublished;
    if (aMyUnpublished && !bMyUnpublished) return -1;
    if (!aMyUnpublished && bMyUnpublished) return 1;

    // Within my unpublished cards, sort by completion (most complete first)
    if (aMyUnpublished && bMyUnpublished) {
      return getCompletionPercentage(b) - getCompletionPercentage(a);
    }

    // Priority 3: My published cards
    const aMyPublished = aOwner && a.isPublished;
    const bMyPublished = bOwner && b.isPublished;
    if (aMyPublished && !bMyPublished) return -1;
    if (!aMyPublished && bMyPublished) return 1;

    // Priority 4: Others' published cards
    // (Others' unpublished cards should be filtered out before calling this function)
    const aOthersPublished = !aOwner && a.isPublished;
    const bOthersPublished = !bOwner && b.isPublished;
    if (aOthersPublished && !bOthersPublished) return -1;
    if (!aOthersPublished && bOthersPublished) return 1;

    return 0;
  });
};
