import { describe, it, expect } from "vitest";
import {
  getCompletionPercentage,
  sortCardsByPriority,
  CardProgress,
} from "../../utils/cardSort";
import { Card } from "../../types/models";

// Helper to create a test card
const createCard = (
  id: string,
  ownerId: string,
  isPublished: boolean,
  tiles: string[],
): Card => ({
  _id: id,
  title: `Card ${id}`,
  createdBy: "Test User",
  ownerId,
  isPublished,
  rows: 3,
  columns: 3,
  tiles: tiles.map((value, index) => ({
    value,
    position: index,
  })),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

describe("getCompletionPercentage", () => {
  it("should return 0 for card with no filled tiles", () => {
    const card = createCard("1", "user1", false, ["", "", "", "", "", "", "", "", ""]);
    expect(getCompletionPercentage(card)).toBe(0);
  });

  it("should return 1 for card with all filled tiles", () => {
    const card = createCard("1", "user1", false, [
      "A",
      "B",
      "C",
      "D",
      "E",
      "F",
      "G",
      "H",
      "I",
    ]);
    expect(getCompletionPercentage(card)).toBe(1);
  });

  it("should return 0.5 for card with half filled tiles", () => {
    const card = createCard("1", "user1", false, [
      "A",
      "B",
      "",
      "D",
      "",
      "F",
      "",
      "",
      "I",
    ]);
    expect(getCompletionPercentage(card)).toBeCloseTo(5 / 9); // A, B, D, F, I = 5 filled
  });

  it("should not count tiles with only whitespace as filled", () => {
    const card = createCard("1", "user1", false, [
      "A",
      "   ",
      "\t",
      "D",
      " ",
      "F",
      "",
      "",
      "I",
    ]);
    expect(getCompletionPercentage(card)).toBeCloseTo(4 / 9); // A, D, F, I = 4 filled
  });

  it("should handle different grid sizes", () => {
    const card = createCard("1", "user1", false, ["A", "B", "", "D"]);
    card.rows = 2;
    card.columns = 2;
    expect(getCompletionPercentage(card)).toBe(0.75);
  });
});

describe("sortCardsByPriority", () => {
  const currentUserId = "user1";
  const otherUserId = "user2";

  // Mock getCardProgress function
  const mockProgress = (progressMap: Record<string, CardProgress>) => {
    return (cardId: string): CardProgress => {
      return progressMap[cardId] || { played: false, completed: false };
    };
  };

  describe("Priority 1: Cards I started but not won yet", () => {
    it("should prioritize played but not completed cards first", () => {
      const cards = [
        createCard("1", currentUserId, true, ["A", "B", "C", "", "", "", "", "", ""]),
        createCard("2", currentUserId, true, ["A", "B", "C", "", "", "", "", "", ""]),
        createCard("3", currentUserId, true, ["A", "B", "C", "", "", "", "", "", ""]),
      ];

      const progressMap = {
        "1": { played: false, completed: false },
        "2": { played: true, completed: false }, // Started but not won
        "3": { played: true, completed: true }, // Won
      };

      const sorted = sortCardsByPriority(cards, currentUserId, mockProgress(progressMap));

      expect(sorted[0]._id).toBe("2"); // Started but not won
      expect(sorted[1]._id).toBe("1"); // Not played
      expect(sorted[2]._id).toBe("3"); // Completed
    });

    it("should prioritize my played-not-won over others' cards", () => {
      const cards = [
        createCard("1", otherUserId, true, ["A", "B", "C", "", "", "", "", "", ""]),
        createCard("2", currentUserId, true, ["A", "B", "C", "", "", "", "", "", ""]),
      ];

      const progressMap = {
        "1": { played: false, completed: false },
        "2": { played: true, completed: false },
      };

      const sorted = sortCardsByPriority(cards, currentUserId, mockProgress(progressMap));

      expect(sorted[0]._id).toBe("2"); // My played-not-won card
    });
  });

  describe("Priority 2: My unpublished cards", () => {
    it("should prioritize my unpublished cards after played-not-won", () => {
      const cards = [
        createCard("1", currentUserId, true, ["A", "B", "C", "", "", "", "", "", ""]),
        createCard("2", currentUserId, false, ["A", "B", "C", "", "", "", "", "", ""]),
      ];

      const progressMap = {
        "1": { played: false, completed: false },
        "2": { played: false, completed: false },
      };

      const sorted = sortCardsByPriority(cards, currentUserId, mockProgress(progressMap));

      expect(sorted[0]._id).toBe("2"); // My unpublished
      expect(sorted[1]._id).toBe("1"); // My published
    });

    it("should sort my unpublished cards by completion (most complete first)", () => {
      const cards = [
        createCard("1", currentUserId, false, ["A", "", "", "", "", "", "", "", ""]), // 11% complete
        createCard("2", currentUserId, false, ["A", "B", "C", "D", "", "", "", "", ""]), // 44% complete
        createCard("3", currentUserId, false, ["A", "B", "", "", "", "", "", "", ""]), // 22% complete
      ];

      const progressMap = {
        "1": { played: false, completed: false },
        "2": { played: false, completed: false },
        "3": { played: false, completed: false },
      };

      const sorted = sortCardsByPriority(cards, currentUserId, mockProgress(progressMap));

      expect(sorted[0]._id).toBe("2"); // 44% complete
      expect(sorted[1]._id).toBe("3"); // 22% complete
      expect(sorted[2]._id).toBe("1"); // 11% complete
    });
  });

  describe("Priority 3: My published cards", () => {
    it("should prioritize my published cards after my unpublished", () => {
      const cards = [
        createCard("1", currentUserId, true, ["A", "B", "C", "", "", "", "", "", ""]),
        createCard("2", currentUserId, false, ["A", "B", "C", "", "", "", "", "", ""]),
      ];

      const progressMap = {
        "1": { played: false, completed: false },
        "2": { played: false, completed: false },
      };

      const sorted = sortCardsByPriority(cards, currentUserId, mockProgress(progressMap));

      expect(sorted[0]._id).toBe("2"); // My unpublished
      expect(sorted[1]._id).toBe("1"); // My published
    });

    it("should prioritize my published over others' published", () => {
      const cards = [
        createCard("1", otherUserId, true, ["A", "B", "C", "", "", "", "", "", ""]),
        createCard("2", currentUserId, true, ["A", "B", "C", "", "", "", "", "", ""]),
      ];

      const progressMap = {
        "1": { played: false, completed: false },
        "2": { played: false, completed: false },
      };

      const sorted = sortCardsByPriority(cards, currentUserId, mockProgress(progressMap));

      expect(sorted[0]._id).toBe("2"); // My published
      expect(sorted[1]._id).toBe("1"); // Others' published
    });
  });

  describe("Priority 4: Others' published cards", () => {
    it("should put others' published cards after my published cards", () => {
      const cards = [
        createCard("1", otherUserId, true, ["A", "B", "C", "", "", "", "", "", ""]),
        createCard("2", currentUserId, true, ["A", "B", "C", "", "", "", "", "", ""]),
      ];

      const progressMap = {
        "1": { played: false, completed: false },
        "2": { played: false, completed: false },
      };

      const sorted = sortCardsByPriority(cards, currentUserId, mockProgress(progressMap));

      expect(sorted[0]._id).toBe("2"); // My published
      expect(sorted[1]._id).toBe("1"); // Others' published
    });
  });

  describe("Complex scenarios", () => {
    it("should correctly sort a mixed set of cards (excluding others' unpublished)", () => {
      const cards = [
        createCard("1", otherUserId, true, ["A", "B", "C", "", "", "", "", "", ""]), // Others' published
        createCard("2", currentUserId, false, ["A", "B", "", "", "", "", "", "", ""]), // My unpublished (22%)
        createCard("3", currentUserId, true, ["A", "B", "C", "", "", "", "", "", ""]), // My published, played not won
        createCard("5", currentUserId, false, ["A", "B", "C", "D", "", "", "", "", ""]), // My unpublished (44%)
        createCard("6", currentUserId, true, ["A", "B", "C", "", "", "", "", "", ""]), // My published
      ];

      const progressMap = {
        "1": { played: false, completed: false },
        "2": { played: false, completed: false },
        "3": { played: true, completed: false }, // Played not won
        "5": { played: false, completed: false },
        "6": { played: false, completed: false },
      };

      const sorted = sortCardsByPriority(cards, currentUserId, mockProgress(progressMap));

      expect(sorted.map((c) => c._id)).toEqual([
        "3", // Priority 1: My played not won
        "5", // Priority 2: My unpublished (44% complete)
        "2", // Priority 2: My unpublished (22% complete)
        "6", // Priority 3: My published
        "1", // Priority 4: Others' published
      ]);
    });

    it("should not mutate the original array", () => {
      const cards = [
        createCard("1", currentUserId, true, ["A", "B", "C", "", "", "", "", "", ""]),
        createCard("2", currentUserId, false, ["A", "B", "C", "", "", "", "", "", ""]),
      ];

      const originalOrder = cards.map((c) => c._id);

      const progressMap = {
        "1": { played: false, completed: false },
        "2": { played: false, completed: false },
      };

      sortCardsByPriority(cards, currentUserId, mockProgress(progressMap));

      expect(cards.map((c) => c._id)).toEqual(originalOrder);
    });

    it("should handle empty array", () => {
      const cards: Card[] = [];
      const sorted = sortCardsByPriority(
        cards,
        currentUserId,
        mockProgress({}),
      );
      expect(sorted).toEqual([]);
    });

    it("should handle single card", () => {
      const cards = [
        createCard("1", currentUserId, true, ["A", "B", "C", "", "", "", "", "", ""]),
      ];

      const progressMap = {
        "1": { played: false, completed: false },
      };

      const sorted = sortCardsByPriority(cards, currentUserId, mockProgress(progressMap));

      expect(sorted.length).toBe(1);
      expect(sorted[0]._id).toBe("1");
    });
  });
});
