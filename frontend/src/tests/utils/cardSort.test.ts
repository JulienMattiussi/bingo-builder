import { describe, it, expect, afterEach } from "vitest";
import {
  getCompletionPercentage,
  sortCardsByPriority,
  CardProgress,
} from "../../utils/cardSort";
import { Card } from "../../types/models";

// Helper to create a test card
const createCard = (
  id: string,
  isPublished: boolean,
  tiles: string[],
  isOwner = false,
): Card => ({
  _id: id,
  title: `Card ${id}`,
  createdBy: "Test User",
  isOwner,
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
    const card = createCard("1", false, [
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
    ]);
    expect(getCompletionPercentage(card)).toBe(0);
  });

  it("should return 1 for card with all filled tiles", () => {
    const card = createCard("1", false, [
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
    const card = createCard("1", false, [
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
    const card = createCard("1", false, [
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
    const card = createCard("1", false, ["A", "B", "", "D"]);
    card.rows = 2;
    card.columns = 2;
    expect(getCompletionPercentage(card)).toBe(0.75);
  });
});

describe("sortCardsByPriority", () => {
  const currentUserId = "user1";

  // Mock getCardProgress function with localStorage
  const mockProgressWithStorage = (
    progressMap: Record<string, CardProgress>,
    checkedTilesMap: Record<string, number[]>,
  ) => {
    // Setup localStorage
    Object.keys(checkedTilesMap).forEach((cardId) => {
      const checkedTiles = checkedTilesMap[cardId];
      localStorage.setItem(
        `bingo-progress-${cardId}`,
        JSON.stringify({ checkedTiles }),
      );
    });

    return (cardId: string): CardProgress => {
      return progressMap[cardId] || { played: false, completed: false };
    };
  };

  afterEach(() => {
    // Clean up localStorage after each test
    localStorage.clear();
  });

  describe("Uncompleted vs Completed cards", () => {
    it("should prioritize uncompleted cards over completed cards", () => {
      const cards = [
        createCard("1", true, [
          "A",
          "B",
          "C",
          "",
          "",
          "",
          "",
          "",
          "",
        ]),
        createCard("2", true, [
          "A",
          "B",
          "C",
          "D",
          "",
          "",
          "",
          "",
          "",
        ]),
        createCard("3", true, [
          "A",
          "B",
          "C",
          "D",
          "E",
          "",
          "",
          "",
          "",
        ]),
      ];

      const progressMap = {
        "1": { played: true, completed: true }, // Completed
        "2": { played: true, completed: false }, // Uncompleted
        "3": { played: true, completed: false }, // Uncompleted
      };

      const checkedTilesMap = {
        "1": [0, 1, 2], // 3 tiles checked
        "2": [0, 1], // 2 tiles checked
        "3": [0, 1, 2, 3], // 4 tiles checked
      };

      const sorted = sortCardsByPriority(
        cards,
        currentUserId,
        mockProgressWithStorage(progressMap, checkedTilesMap),
      );

      // Uncompleted cards first (sorted by checked count descending)
      expect(sorted[0]._id).toBe("3"); // Uncompleted, 4 checked
      expect(sorted[1]._id).toBe("2"); // Uncompleted, 2 checked
      expect(sorted[2]._id).toBe("1"); // Completed, 3 checked (last)
    });
  });

  describe("Sorting by checked tiles count", () => {
    it("should sort uncompleted cards by checked tiles descending", () => {
      const cards = [
        createCard("1", true, [
          "A",
          "B",
          "C",
          "",
          "",
          "",
          "",
          "",
          "",
        ]),
        createCard("2", true, [
          "A",
          "B",
          "C",
          "D",
          "",
          "",
          "",
          "",
          "",
        ]),
        createCard("3", true, [
          "A",
          "",
          "",
          "",
          "",
          "",
          "",
          "",
          "",
        ]),
      ];

      const progressMap = {
        "1": { played: true, completed: false },
        "2": { played: true, completed: false },
        "3": { played: true, completed: false },
      };

      const checkedTilesMap = {
        "1": [0, 1], // 2 tiles checked
        "2": [0, 1, 2, 3, 4], // 5 tiles checked
        "3": [0], // 1 tile checked
      };

      const sorted = sortCardsByPriority(
        cards,
        currentUserId,
        mockProgressWithStorage(progressMap, checkedTilesMap),
      );

      expect(sorted[0]._id).toBe("2"); // 5 checked
      expect(sorted[1]._id).toBe("1"); // 2 checked
      expect(sorted[2]._id).toBe("3"); // 1 checked
    });

    it("should sort completed cards by checked tiles descending", () => {
      const cards = [
        createCard("1", true, [
          "A",
          "B",
          "C",
          "",
          "",
          "",
          "",
          "",
          "",
        ]),
        createCard("2", true, [
          "A",
          "B",
          "C",
          "D",
          "",
          "",
          "",
          "",
          "",
        ]),
        createCard("3", true, [
          "A",
          "",
          "",
          "",
          "",
          "",
          "",
          "",
          "",
        ]),
      ];

      const progressMap = {
        "1": { played: true, completed: true },
        "2": { played: true, completed: true },
        "3": { played: true, completed: true },
      };

      const checkedTilesMap = {
        "1": [0, 1, 2], // 3 tiles checked
        "2": [0, 1, 2, 3, 4, 5], // 6 tiles checked
        "3": [0, 1], // 2 tiles checked
      };

      const sorted = sortCardsByPriority(
        cards,
        currentUserId,
        mockProgressWithStorage(progressMap, checkedTilesMap),
      );

      expect(sorted[0]._id).toBe("2"); // 6 checked
      expect(sorted[1]._id).toBe("1"); // 3 checked
      expect(sorted[2]._id).toBe("3"); // 2 checked
    });

    it("should handle cards with no checked tiles", () => {
      const cards = [
        createCard("1", true, [
          "A",
          "B",
          "C",
          "",
          "",
          "",
          "",
          "",
          "",
        ]),
        createCard("2", true, [
          "A",
          "B",
          "C",
          "D",
          "",
          "",
          "",
          "",
          "",
        ]),
      ];

      const progressMap = {
        "1": { played: false, completed: false },
        "2": { played: true, completed: false },
      };

      const checkedTilesMap = {
        "2": [0, 1], // 2 tiles checked
        // "1" has no progress in localStorage
      };

      const sorted = sortCardsByPriority(
        cards,
        currentUserId,
        mockProgressWithStorage(progressMap, checkedTilesMap),
      );

      expect(sorted[0]._id).toBe("2"); // 2 checked
      expect(sorted[1]._id).toBe("1"); // 0 checked
    });
  });

  describe("Mixed scenarios", () => {
    it("should correctly sort mixed completed and uncompleted cards", () => {
      const cards = [
        createCard("1", true, [
          "A",
          "B",
          "C",
          "",
          "",
          "",
          "",
          "",
          "",
        ]),
        createCard("2", true, [
          "A",
          "B",
          "C",
          "D",
          "",
          "",
          "",
          "",
          "",
        ]),
        createCard("3", true, [
          "A",
          "",
          "",
          "",
          "",
          "",
          "",
          "",
          "",
        ]),
        createCard("4", true, [
          "A",
          "B",
          "",
          "",
          "",
          "",
          "",
          "",
          "",
        ]),
      ];

      const progressMap = {
        "1": { played: true, completed: false }, // Uncompleted
        "2": { played: true, completed: true }, // Completed
        "3": { played: true, completed: false }, // Uncompleted
        "4": { played: true, completed: true }, // Completed
      };

      const checkedTilesMap = {
        "1": [0, 1], // 2 tiles
        "2": [0, 1, 2, 3, 4, 5], // 6 tiles
        "3": [0, 1, 2, 3], // 4 tiles
        "4": [0], // 1 tile
      };

      const sorted = sortCardsByPriority(
        cards,
        currentUserId,
        mockProgressWithStorage(progressMap, checkedTilesMap),
      );

      expect(sorted.map((c) => c._id)).toEqual([
        "3", // Uncompleted, 4 checked
        "1", // Uncompleted, 2 checked
        "2", // Completed, 6 checked
        "4", // Completed, 1 checked
      ]);
    });
  });

  describe("Edge cases", () => {
    it("should not mutate the original array", () => {
      const cards = [
        createCard("1", true, [
          "A",
          "B",
          "C",
          "",
          "",
          "",
          "",
          "",
          "",
        ]),
        createCard("2", false, [
          "A",
          "B",
          "C",
          "",
          "",
          "",
          "",
          "",
          "",
        ]),
      ];

      const originalOrder = cards.map((c) => c._id);

      const progressMap = {
        "1": { played: false, completed: false },
        "2": { played: false, completed: false },
      };

      sortCardsByPriority(
        cards,
        currentUserId,
        mockProgressWithStorage(progressMap, {}),
      );

      expect(cards.map((c) => c._id)).toEqual(originalOrder);
    });

    it("should handle empty array", () => {
      const cards: Card[] = [];
      const sorted = sortCardsByPriority(
        cards,
        currentUserId,
        mockProgressWithStorage({}, {}),
      );
      expect(sorted).toEqual([]);
    });

    it("should handle single card", () => {
      const cards = [
        createCard("1", true, [
          "A",
          "B",
          "C",
          "",
          "",
          "",
          "",
          "",
          "",
        ]),
      ];

      const progressMap = {
        "1": { played: false, completed: false },
      };

      const sorted = sortCardsByPriority(
        cards,
        currentUserId,
        mockProgressWithStorage(progressMap, {}),
      );

      expect(sorted.length).toBe(1);
      expect(sorted[0]._id).toBe("1");
    });
  });
});
