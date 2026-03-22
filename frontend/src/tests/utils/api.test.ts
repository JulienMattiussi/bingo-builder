import { describe, it, expect, vi, beforeEach } from "vitest";
import { api } from "../../utils/api";

// Mock fetch
global.fetch = vi.fn();

describe("API Utility", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getCards", () => {
    it("should fetch all cards", async () => {
      const mockCards = [
        {
          _id: "1",
          title: "Card 1",
          rows: 3,
          columns: 3,
          tiles: [],
          isPublished: true,
          createdBy: "user1",
        },
      ];

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockCards,
      });

      const cards = await api.getCards();
      expect(cards).toEqual(mockCards);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/cards"),
      );
    });

    it("should handle fetch errors", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error("Network error"),
      );

      await expect(api.getCards()).rejects.toThrow("Network error");
    });
  });

  describe("getCard", () => {
    it("should fetch a specific card by id", async () => {
      const mockCard = {
        _id: "123",
        title: "Test Card",
        rows: 3,
        columns: 3,
        tiles: [],
        isPublished: true,
        createdBy: "user1",
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockCard,
      });

      const card = await api.getCard("123");
      expect(card).toEqual(mockCard);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/cards/123"),
      );
    });

    it("should handle 404 errors", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ message: "Card not found" }),
      });

      await expect(api.getCard("nonexistent")).rejects.toThrow();
    });
  });

  describe("createCard", () => {
    it("should create a new card", async () => {
      const newCard = {
        title: "New Card",
        rows: 3,
        columns: 3,
        tiles: Array.from({ length: 9 }, (_, i) => ({
          value: `Tile ${i}`,
          position: i,
        })),
        createdBy: "user1",
      };

      const mockResponse = {
        _id: "new-id",
        ...newCard,
        isPublished: false,
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const card = await api.createCard(newCard);
      expect(card).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/cards"),
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify(newCard),
        }),
      );
    });

    it("should handle validation errors", async () => {
      const invalidCard = {
        title: "Invalid",
        rows: 3,
        columns: 3,
        tiles: [], // Wrong number of tiles
        createdBy: "user1",
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ message: "Invalid data" }),
      });

      await expect(api.createCard(invalidCard)).rejects.toThrow();
    });
  });

  describe("updateCard", () => {
    it("should update an existing card", async () => {
      const updates = {
        title: "Updated Title",
        createdBy: "user1",
        rows: 3,
        columns: 3,
        tiles: [],
      };

      const mockResponse = {
        _id: "123",
        ...updates,
        isPublished: false,
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const card = await api.updateCard("123", updates);
      expect(card).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/cards/123"),
        expect.objectContaining({
          method: "PUT",
          body: JSON.stringify(updates),
        }),
      );
    });

    it("should handle authorization errors", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({ message: "Not authorized" }),
      });

      await expect(
        api.updateCard("123", {
          title: "Hack",
          createdBy: "hacker",
          rows: 2,
          columns: 2,
          tiles: [],
        }),
      ).rejects.toThrow();
    });
  });

  describe("publishCard", () => {
    it("should publish a card", async () => {
      const mockResponse = {
        _id: "123",
        title: "Card",
        isPublished: true,
        publishedAt: new Date().toISOString(),
        rows: 3,
        columns: 3,
        tiles: [],
        createdBy: "user1",
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const card = await api.publishCard("123", "user1");
      expect(card.isPublished).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/cards/123/publish"),
        expect.objectContaining({
          method: "POST",
        }),
      );
    });

    it("should handle publish errors without message", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({}), // No message property
      });

      await expect(api.publishCard("123", "user1")).rejects.toThrow(
        "Failed to publish card",
      );
    });
  });

  describe("unpublishCard", () => {
    it("should unpublish a card", async () => {
      const mockResponse = {
        _id: "123",
        title: "Card",
        isPublished: false,
        publishedAt: null,
        rows: 3,
        columns: 3,
        tiles: [],
        createdBy: "user1",
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const card = await api.unpublishCard("123", "user1");
      expect(card.isPublished).toBe(false);
    });

    it("should handle unpublish errors without message", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({}), // No message property
      });

      await expect(api.unpublishCard("123", "user1")).rejects.toThrow(
        "Failed to unpublish card",
      );
    });
  });

  describe("deleteCard", () => {
    it("should delete a card", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: "Card deleted successfully" }),
      });

      await api.deleteCard("123", "user1");
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/cards/123?createdBy=user1"),
        expect.objectContaining({
          method: "DELETE",
        }),
      );
    });

    it("should handle delete errors", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({ message: "Cannot delete published card" }),
      });

      await expect(api.deleteCard("123", "user1")).rejects.toThrow();
    });
  });

  describe("deleteCardsByCreator", () => {
    it("should delete all cards by creator", async () => {
      const mockResponse = {
        message: "Cards deleted successfully",
        deletedCount: 5,
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await api.deleteCardsByCreator("user1");
      expect(result.deletedCount).toBe(5);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/cards/delete-by-creator"),
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ createdBy: "user1" }),
        }),
      );
    });

    it("should handle errors when deleting cards by creator", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ message: "Failed to delete cards" }),
      });

      await expect(api.deleteCardsByCreator("user1")).rejects.toThrow();
    });
  });

  describe("updateCreatorName", () => {
    it("should update creator name for all cards", async () => {
      const mockResponse = {
        message: "Creator name updated",
        updatedCount: 3,
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await api.updateCreatorName("oldName", "newName");
      expect(result.updatedCount).toBe(3);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/cards/update-creator"),
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ oldName: "oldName", newName: "newName" }),
        }),
      );
    });

    it("should handle errors when updating creator name", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ message: "Failed to update creator name" }),
      });

      await expect(
        api.updateCreatorName("oldName", "newName"),
      ).rejects.toThrow();
    });
  });

  describe("Peer Discovery", () => {
    describe("registerPeer", () => {
      it("should register a peer for a card", async () => {
        const mockResponse = {
          peerId: "peer123",
          playerName: "Player1",
          checkedCount: 0,
        };

        (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

        const result = await api.registerPeer(
          "card123",
          "peer123",
          "Player1",
          0,
        );
        expect(result.peerId).toBe("peer123");
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining("/api/peers/card123/register"),
          expect.objectContaining({
            method: "POST",
            body: JSON.stringify({
              peerId: "peer123",
              playerName: "Player1",
              checkedCount: 0,
            }),
          }),
        );
      });

      it("should handle errors when registering peer", async () => {
        (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
          ok: false,
          status: 400,
          json: async () => ({ message: "Failed to register peer" }),
        });

        await expect(
          api.registerPeer("card123", "peer123", "Player1"),
        ).rejects.toThrow();
      });
    });

    describe("getActivePeers", () => {
      it("should fetch active peers for a card", async () => {
        const mockPeers = [
          { peerId: "peer1", playerName: "Player1", checkedCount: 5 },
          { peerId: "peer2", playerName: "Player2", checkedCount: 3 },
        ];

        (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
          ok: true,
          json: async () => mockPeers,
        });

        const peers = await api.getActivePeers("card123");
        expect(peers).toHaveLength(2);
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining("/api/peers/card123/peers"),
        );
      });

      it("should exclude specified peer when fetching active peers", async () => {
        const mockPeers = [
          { peerId: "peer2", playerName: "Player2", checkedCount: 3 },
        ];

        (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
          ok: true,
          json: async () => mockPeers,
        });

        const peers = await api.getActivePeers("card123", "peer1");
        expect(peers).toHaveLength(1);
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining("excludePeerId=peer1"),
        );
      });

      it("should handle errors when fetching active peers", async () => {
        (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
          ok: false,
          status: 404,
        });

        await expect(api.getActivePeers("card123")).rejects.toThrow();
      });
    });

    describe("unregisterPeer", () => {
      it("should unregister a peer", async () => {
        (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
          ok: true,
          json: async () => ({ message: "Peer unregistered" }),
        });

        await api.unregisterPeer("card123", "peer123");
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining("/api/peers/card123/unregister/peer123"),
          expect.objectContaining({
            method: "DELETE",
          }),
        );
      });

      it("should handle errors when unregistering peer", async () => {
        (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
          ok: false,
          status: 404,
        });

        await expect(
          api.unregisterPeer("card123", "peer123"),
        ).rejects.toThrow();
      });
    });

    describe("peerHeartbeat", () => {
      it("should send peer heartbeat", async () => {
        (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
          ok: true,
          json: async () => ({ message: "Heartbeat received" }),
        });

        await api.peerHeartbeat("card123", "peer123", 7);
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining("/api/peers/card123/heartbeat/peer123"),
          expect.objectContaining({
            method: "POST",
            body: JSON.stringify({ checkedCount: 7 }),
          }),
        );
      });

      it("should handle errors when sending heartbeat", async () => {
        (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
          ok: false,
          status: 404,
        });

        await expect(
          api.peerHeartbeat("card123", "peer123", 7),
        ).rejects.toThrow();
      });
    });
  });
});
