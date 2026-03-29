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
        ownerId: "test-owner-id",
      };

      const mockResponse = {
        _id: "new-id",
        title: newCard.title,
        rows: newCard.rows,
        columns: newCard.columns,
        tiles: newCard.tiles,
        createdBy: newCard.createdBy,
        isOwner: true,
        isPublished: false,
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const card = await api.createCard(newCard);
      expect(card.isOwner).toBe(true);
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
        ownerId: "test-owner-id",
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
        ownerId: "test-owner-id",
        rows: 3,
        columns: 3,
        tiles: [],
      };

      const mockResponse = {
        _id: "123",
        title: updates.title,
        rows: updates.rows,
        columns: updates.columns,
        tiles: updates.tiles,
        createdBy: updates.createdBy,
        isOwner: true,
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
          ownerId: "test-owner-id",
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
        expect.stringContaining("/api/cards/123?ownerId=user1"),
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
          body: JSON.stringify({ ownerId: "user1" }),
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

      const result = await api.updateCreatorName(
        "oldName",
        "newName",
        "test-owner-id",
      );
      expect(result.updatedCount).toBe(3);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/cards/update-creator"),
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            oldName: "oldName",
            newName: "newName",
            ownerId: "test-owner-id",
          }),
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
        api.updateCreatorName("oldName", "newName", "test-owner-id"),
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

  describe("Export/Import", () => {
    describe("exportCards", () => {
      it("should export cards for a user", async () => {
        const mockExportData = {
          version: "2.0",
          exportDate: "2024-03-29T10:00:00.000Z",
          user: { nickname: "TestUser", ownerId: "owner123" },
          cardCount: 2,
          cards: [
            {
              _id: "card1",
              title: "Test Card 1",
              ownerId: "owner123",
              rows: 2,
              columns: 2,
              tiles: [{ value: "Tile 1" }],
              isPublished: false,
              createdAt: "2024-03-29T10:00:00.000Z",
              updatedAt: "2024-03-29T10:00:00.000Z",
            },
            {
              _id: "card2",
              title: "Test Card 2",
              ownerId: "owner123",
              rows: 3,
              columns: 3,
              tiles: [{ value: "Tile 2" }],
              isPublished: true,
              createdAt: "2024-03-29T10:00:00.000Z",
              updatedAt: "2024-03-29T10:00:00.000Z",
            },
          ],
          progress: {},
        };

        (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
          ok: true,
          json: async () => mockExportData,
        });

        const result = await api.exportCards("owner123");

        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining("/api/cards/export?ownerId=owner123"),
        );
        expect(result.version).toBe("2.0");
        expect(result.cardCount).toBe(2);
        expect(result.cards).toHaveLength(2);
        expect(result.cards[0]._id).toBe("card1");
      });

      it("should handle errors when exporting cards", async () => {
        (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
          ok: false,
          status: 400,
          json: async () => ({ message: "Owner ID is required" }),
        });

        await expect(api.exportCards("")).rejects.toThrow(
          "Owner ID is required",
        );
      });
    });

    describe("importCards", () => {
      it("should import cards successfully", async () => {
        const mockCards = [
          {
            _id: "imported-card-1",
            title: "Imported Card",
            createdBy: "owner123",
            ownerId: "owner123",
            rows: 2,
            columns: 2,
            tiles: [
              { value: "Tile 1", position: 0 },
              { value: "Tile 2", position: 1 },
              { value: "Tile 3", position: 2 },
              { value: "Tile 4", position: 3 },
            ],
            isPublished: false,
            createdAt: "2024-03-29T10:00:00.000Z",
            updatedAt: "2024-03-29T10:00:00.000Z",
          },
        ];

        const mockResponse = {
          message: "Successfully imported 1 cards",
          importedCount: 1,
          skippedCount: 0,
          errorCount: 0,
        };

        (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

        const result = await api.importCards("owner123", mockCards);

        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining("/api/cards/import"),
          expect.objectContaining({
            method: "POST",
            body: JSON.stringify({
              ownerId: "owner123",
              cards: mockCards,
              user: undefined,
              progress: undefined,
            }),
          }),
        );
        expect(result.importedCount).toBe(1);
        expect(result.skippedCount).toBe(0);
        expect(result.errorCount).toBe(0);
      });

      it("should import cards with user data and progress", async () => {
        const mockCards = [
          {
            _id: "card1",
            title: "Card 1",
            createdBy: "owner123",
            ownerId: "owner123",
            rows: 2,
            columns: 2,
            tiles: [
              { value: "Tile 1", position: 0 },
              { value: "Tile 2", position: 1 },
              { value: "Tile 3", position: 2 },
              { value: "Tile 4", position: 3 },
            ],
            isPublished: false,
            createdAt: "2024-03-29T10:00:00.000Z",
            updatedAt: "2024-03-29T10:00:00.000Z",
          },
        ];

        const mockUser = { nickname: "TestUser", ownerId: "owner123" };
        const mockProgress = { card1: [0, 1] };

        const mockResponse = {
          message: "Successfully imported 1 cards",
          importedCount: 1,
          skippedCount: 0,
          errorCount: 0,
        };

        (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

        const result = await api.importCards(
          "owner123",
          mockCards,
          mockUser,
          mockProgress,
        );

        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining("/api/cards/import"),
          expect.objectContaining({
            method: "POST",
            body: JSON.stringify({
              ownerId: "owner123",
              cards: mockCards,
              user: mockUser,
              progress: mockProgress,
            }),
          }),
        );
        expect(result.importedCount).toBe(1);
      });

      it("should handle skipped cards during import", async () => {
        const mockCards = [
          {
            _id: "card1",
            title: "Card 1",
            createdBy: "owner123",
            ownerId: "owner123",
            rows: 2,
            columns: 2,
            tiles: [
              { value: "Tile 1", position: 0 },
              { value: "Tile 2", position: 1 },
              { value: "Tile 3", position: 2 },
              { value: "Tile 4", position: 3 },
            ],
            isPublished: false,
            createdAt: "2024-03-29T10:00:00.000Z",
            updatedAt: "2024-03-29T10:00:00.000Z",
          },
        ];

        const mockResponse = {
          message: "Successfully imported 0 cards, skipped 1 existing",
          importedCount: 0,
          skippedCount: 1,
          errorCount: 0,
        };

        (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

        const result = await api.importCards("owner123", mockCards);

        expect(result.importedCount).toBe(0);
        expect(result.skippedCount).toBe(1);
      });

      it("should handle errors during import", async () => {
        const mockCards = [
          {
            _id: "card1",
            title: "Card 1",
            createdBy: "owner123",
            ownerId: "owner123",
            rows: 2,
            columns: 2,
            tiles: [
              { value: "Tile 1", position: 0 },
              { value: "Tile 2", position: 1 },
              { value: "Tile 3", position: 2 },
              { value: "Tile 4", position: 3 },
            ],
            isPublished: false,
            createdAt: "2024-03-29T10:00:00.000Z",
            updatedAt: "2024-03-29T10:00:00.000Z",
          },
        ];

        (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
          ok: false,
          status: 400,
          json: async () => ({ message: "Import validation failed" }),
        });

        await expect(api.importCards("owner123", mockCards)).rejects.toThrow(
          "Import validation failed",
        );
      });

      it("should handle partial import with errors", async () => {
        const mockCards = [
          {
            _id: "card1",
            title: "Card 1",
            createdBy: "owner123",
            ownerId: "owner123",
            rows: 2,
            columns: 2,
            tiles: [
              { value: "Tile 1", position: 0 },
              { value: "Tile 2", position: 1 },
              { value: "Tile 3", position: 2 },
              { value: "Tile 4", position: 3 },
            ],
            isPublished: false,
            createdAt: "2024-03-29T10:00:00.000Z",
            updatedAt: "2024-03-29T10:00:00.000Z",
          },
        ];

        const mockResponse = {
          message: "Partial import",
          importedCount: 1,
          skippedCount: 0,
          errorCount: 1,
          errors: [{ index: 1, message: "Missing required fields" }],
        };

        (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

        const result = await api.importCards("owner123", mockCards);

        expect(result.importedCount).toBe(1);
        expect(result.errorCount).toBe(1);
        expect(result.errors).toHaveLength(1);
        expect(result.errors?.[0].message).toBe("Missing required fields");
      });
    });
  });

  describe("Super Admin API Methods", () => {
    describe("superAdminLogin", () => {
      it("should successfully login with valid password", async () => {
        const mockResponse = { token: "jwt-token-12345" };

        (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

        const result = await api.superAdminLogin("correct-password");

        expect(fetch).toHaveBeenCalledWith(
          "/api/superadmin/login",
          expect.objectContaining({
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ password: "correct-password" }),
          }),
        );
        expect(result.token).toBe("jwt-token-12345");
      });

      it("should throw error on login failure", async () => {
        (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
          ok: false,
          json: async () => ({ message: "Invalid password" }),
        });

        await expect(api.superAdminLogin("wrong-password")).rejects.toThrow(
          "Invalid password",
        );
      });

      it("should throw default error message when server error has no message", async () => {
        (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
          ok: false,
          json: async () => ({}),
        });

        await expect(api.superAdminLogin("password")).rejects.toThrow(
          "Login failed",
        );
      });
    });

    describe("superAdminChangePassword", () => {
      const token = "jwt-token";
      const currentPassword = "old-pass";
      const newPassword = "new-pass";

      it("should successfully change password with valid credentials", async () => {
        const mockResponse = { message: "Password changed successfully" };

        (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

        const result = await api.superAdminChangePassword(
          token,
          currentPassword,
          newPassword,
        );

        expect(fetch).toHaveBeenCalledWith(
          "/api/superadmin/change-password",
          expect.objectContaining({
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ currentPassword, newPassword }),
          }),
        );
        expect(result.message).toBe("Password changed successfully");
      });

      it("should throw error when current password is incorrect", async () => {
        (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
          ok: false,
          json: async () => ({ message: "Current password incorrect" }),
        });

        await expect(
          api.superAdminChangePassword(token, "wrong", newPassword),
        ).rejects.toThrow("Current password incorrect");
      });

      it("should throw default error message on failure without message", async () => {
        (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
          ok: false,
          json: async () => ({}),
        });

        await expect(
          api.superAdminChangePassword(token, currentPassword, newPassword),
        ).rejects.toThrow("Failed to change password");
      });
    });

    describe("superAdminListAllCards", () => {
      const token = "jwt-token";

      it("should successfully fetch all cards", async () => {
        const mockCards = [
          {
            _id: "card1",
            title: "Admin Card 1",
            createdBy: "user1",
            ownerId: "user1",
            rows: 3,
            columns: 3,
            tiles: Array(9)
              .fill(null)
              .map((_, i) => ({ value: `Tile ${i}`, position: i })),
            isPublished: true,
            createdAt: "2024-03-29T10:00:00.000Z",
            updatedAt: "2024-03-29T10:00:00.000Z",
          },
          {
            _id: "card2",
            title: "Admin Card 2",
            createdBy: "user2",
            ownerId: "user2",
            rows: 4,
            columns: 4,
            tiles: Array(16)
              .fill(null)
              .map((_, i) => ({ value: `Tile ${i}`, position: i })),
            isPublished: false,
            createdAt: "2024-03-29T11:00:00.000Z",
            updatedAt: "2024-03-29T11:00:00.000Z",
          },
        ];

        (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
          ok: true,
          json: async () => mockCards,
        });

        const result = await api.superAdminListAllCards(token);

        expect(fetch).toHaveBeenCalledWith(
          "/api/superadmin/cards",
          expect.objectContaining({
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
        );
        expect(result).toHaveLength(2);
        expect(result[0]._id).toBe("card1");
        expect(result[1]._id).toBe("card2");
      });

      it("should throw error when unauthorized", async () => {
        (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
          ok: false,
          json: async () => ({ message: "Unauthorized" }),
        });

        await expect(
          api.superAdminListAllCards("invalid-token"),
        ).rejects.toThrow("Unauthorized");
      });

      it("should throw default error message on failure", async () => {
        (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
          ok: false,
          json: async () => ({}),
        });

        await expect(api.superAdminListAllCards(token)).rejects.toThrow(
          "Failed to fetch cards",
        );
      });
    });

    describe("superAdminDeleteCard", () => {
      const token = "jwt-token";
      const cardId = "card123";

      it("should successfully delete a card", async () => {
        const mockResponse = { message: "Card deleted successfully" };

        (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

        const result = await api.superAdminDeleteCard(token, cardId);

        expect(fetch).toHaveBeenCalledWith(
          `/api/superadmin/cards/${cardId}`,
          expect.objectContaining({
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
        );
        expect(result.message).toBe("Card deleted successfully");
      });

      it("should throw error when card not found", async () => {
        (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
          ok: false,
          json: async () => ({ message: "Card not found" }),
        });

        await expect(
          api.superAdminDeleteCard(token, "nonexistent"),
        ).rejects.toThrow("Card not found");
      });

      it("should throw default error message on failure", async () => {
        (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
          ok: false,
          json: async () => ({}),
        });

        await expect(api.superAdminDeleteCard(token, cardId)).rejects.toThrow(
          "Failed to delete card",
        );
      });
    });

    describe("superAdminDeleteUser", () => {
      const token = "jwt-token";
      const ownerId = "user123";

      it("should successfully delete a user and their cards", async () => {
        const mockResponse = {
          message: "User and cards deleted successfully",
          deletedCardsCount: 5,
        };

        (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

        const result = await api.superAdminDeleteUser(token, ownerId);

        expect(fetch).toHaveBeenCalledWith(
          `/api/superadmin/users/${ownerId}`,
          expect.objectContaining({
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
        );
        expect(result.message).toBe("User and cards deleted successfully");
        expect(result.deletedCardsCount).toBe(5);
      });

      it("should throw error when user not found", async () => {
        (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
          ok: false,
          json: async () => ({ message: "User not found" }),
        });

        await expect(
          api.superAdminDeleteUser(token, "nonexistent"),
        ).rejects.toThrow("User not found");
      });

      it("should throw default error message on failure", async () => {
        (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
          ok: false,
          json: async () => ({}),
        });

        await expect(api.superAdminDeleteUser(token, ownerId)).rejects.toThrow(
          "Failed to delete user",
        );
      });
    });

    describe("superAdminGetStats", () => {
      const token = "jwt-token";

      it("should successfully fetch statistics", async () => {
        const mockStats = {
          totalCards: 150,
          publishedCards: 100,
          unpublishedCards: 50,
          totalUsers: 75,
        };

        (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
          ok: true,
          json: async () => mockStats,
        });

        const result = await api.superAdminGetStats(token);

        expect(fetch).toHaveBeenCalledWith(
          "/api/superadmin/stats",
          expect.objectContaining({
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
        );
        expect(result.totalCards).toBe(150);
        expect(result.publishedCards).toBe(100);
        expect(result.unpublishedCards).toBe(50);
        expect(result.totalUsers).toBe(75);
      });

      it("should throw error when unauthorized", async () => {
        (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
          ok: false,
          json: async () => ({ message: "Unauthorized access" }),
        });

        await expect(api.superAdminGetStats("invalid-token")).rejects.toThrow(
          "Unauthorized access",
        );
      });

      it("should throw default error message on failure", async () => {
        (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
          ok: false,
          json: async () => ({}),
        });

        await expect(api.superAdminGetStats(token)).rejects.toThrow(
          "Failed to fetch stats",
        );
      });
    });
  });
});
