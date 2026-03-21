/**
 * Custom hook to get card progress from localStorage
 */
export const useCardProgress = () => {
  const getCardProgress = (cardId, totalTiles) => {
    const stored = localStorage.getItem(`bingo-card-${cardId}`);
    if (!stored) {
      return {
        played: false,
        completed: false,
        checkedCount: 0,
        checkedTiles: [],
      };
    }
    try {
      const checkedTiles = JSON.parse(stored);
      return {
        played: true,
        completed: checkedTiles.length === totalTiles,
        checkedCount: checkedTiles.length,
        checkedTiles: checkedTiles,
      };
    } catch {
      return {
        played: false,
        completed: false,
        checkedCount: 0,
        checkedTiles: [],
      };
    }
  };

  return { getCardProgress };
};
