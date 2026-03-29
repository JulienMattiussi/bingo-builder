import { Card } from "../types/models";

const API_BASE_URL = "/api";

// Card data for create/update operations (omits database-generated fields)
type CardMutationData = Omit<
  Card,
  "_id" | "isPublished" | "publishedAt" | "createdAt" | "updatedAt"
>;

interface CardStats {
  published: number;
  unpublished: number;
  maxPublished: number;
  maxUnpublished: number;
  canCreate: boolean;
  canPublish: boolean;
}

export const api = {
  // Get all cards
  async getCards(): Promise<Card[]> {
    const response = await fetch(`${API_BASE_URL}/cards`);
    if (!response.ok) throw new Error("Failed to fetch cards");
    return response.json();
  },

  // Get card statistics
  async getCardStats(): Promise<CardStats> {
    const response = await fetch(`${API_BASE_URL}/cards/stats/counts`);
    if (!response.ok) throw new Error("Failed to fetch card stats");
    return response.json();
  },

  // Get a single card
  async getCard(id: string): Promise<Card> {
    const response = await fetch(`${API_BASE_URL}/cards/${id}`);
    if (!response.ok) throw new Error("Failed to fetch card");
    return response.json();
  },

  // Create a new card
  async createCard(cardData: CardMutationData): Promise<Card> {
    const response = await fetch(`${API_BASE_URL}/cards`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(cardData),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to create card");
    }
    return response.json();
  },

  // Update a card
  async updateCard(id: string, cardData: CardMutationData): Promise<Card> {
    const response = await fetch(`${API_BASE_URL}/cards/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(cardData),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to update card");
    }
    return response.json();
  },

  // Publish a card
  async publishCard(id: string, ownerId: string): Promise<Card> {
    const response = await fetch(`${API_BASE_URL}/cards/${id}/publish`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ownerId }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to publish card");
    }
    return response.json();
  },

  // Unpublish a card
  async unpublishCard(id: string, ownerId: string): Promise<Card> {
    const response = await fetch(`${API_BASE_URL}/cards/${id}/unpublish`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ownerId }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to unpublish card");
    }
    return response.json();
  },

  // Delete a card
  async deleteCard(id: string, ownerId: string): Promise<{ message: string }> {
    const url = ownerId
      ? `${API_BASE_URL}/cards/${id}?ownerId=${encodeURIComponent(ownerId)}`
      : `${API_BASE_URL}/cards/${id}`;
    const response = await fetch(url, {
      method: "DELETE",
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to delete card");
    }
    return response.json();
  },

  // Delete all cards by owner
  async deleteCardsByCreator(
    ownerId: string,
  ): Promise<{ message: string; deletedCount: number }> {
    const response = await fetch(`${API_BASE_URL}/cards/delete-by-creator`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ownerId }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to delete cards");
    }
    return response.json();
  },

  // Update creator name for all cards
  async updateCreatorName(oldName: string, newName: string, ownerId: string) {
    const response = await fetch(`${API_BASE_URL}/cards/update-creator`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ oldName, newName, ownerId }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to update creator name");
    }
    return response.json();
  },

  // Peer discovery endpoints
  async registerPeer(
    cardId: string,
    peerId: string,
    playerName: string,
    checkedCount = 0,
  ) {
    const response = await fetch(`${API_BASE_URL}/peers/${cardId}/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ peerId, playerName, checkedCount }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to register peer");
    }
    return response.json();
  },

  async getActivePeers(cardId: string, excludePeerId?: string) {
    let url = `${API_BASE_URL}/peers/${cardId}/peers`;
    if (excludePeerId) {
      url += `?excludePeerId=${encodeURIComponent(excludePeerId)}`;
    }
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("Failed to fetch active peers");
    }
    return response.json();
  },

  async unregisterPeer(cardId: string, peerId: string) {
    const response = await fetch(
      `${API_BASE_URL}/peers/${cardId}/unregister/${peerId}`,
      {
        method: "DELETE",
      },
    );
    if (!response.ok) {
      throw new Error("Failed to unregister peer");
    }
    return response.json();
  },

  async peerHeartbeat(cardId: string, peerId: string, checkedCount: number) {
    const response = await fetch(
      `${API_BASE_URL}/peers/${cardId}/heartbeat/${peerId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ checkedCount }),
      },
    );
    if (!response.ok) {
      throw new Error("Failed to send heartbeat");
    }
    return response.json();
  },

  // Super Admin endpoints (JWT protected)
  async superAdminLogin(password: string): Promise<{ token: string }> {
    const response = await fetch(`${API_BASE_URL}/superadmin/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ password }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Login failed");
    }
    return response.json();
  },

  async superAdminChangePassword(
    token: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/superadmin/change-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to change password");
    }
    return response.json();
  },

  async superAdminListAllCards(token: string): Promise<Card[]> {
    const response = await fetch(`${API_BASE_URL}/superadmin/cards`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to fetch cards");
    }
    return response.json();
  },

  async superAdminDeleteCard(
    token: string,
    cardId: string,
  ): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/superadmin/cards/${cardId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to delete card");
    }
    return response.json();
  },

  async superAdminDeleteUser(
    token: string,
    ownerId: string,
  ): Promise<{ message: string; deletedCardsCount: number }> {
    const response = await fetch(
      `${API_BASE_URL}/superadmin/users/${ownerId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to delete user");
    }
    return response.json();
  },

  async superAdminGetStats(token: string): Promise<{
    totalCards: number;
    publishedCards: number;
    unpublishedCards: number;
    totalUsers: number;
  }> {
    const response = await fetch(`${API_BASE_URL}/superadmin/stats`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to fetch stats");
    }
    return response.json();
  },
};
