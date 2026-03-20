const API_BASE_URL = "/api";

export const api = {
  // Get all cards
  async getCards() {
    const response = await fetch(`${API_BASE_URL}/cards`);
    if (!response.ok) throw new Error("Failed to fetch cards");
    return response.json();
  },

  // Get a single card
  async getCard(id) {
    const response = await fetch(`${API_BASE_URL}/cards/${id}`);
    if (!response.ok) throw new Error("Failed to fetch card");
    return response.json();
  },

  // Create a new card
  async createCard(cardData) {
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
  async updateCard(id, cardData) {
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
  async publishCard(id) {
    const response = await fetch(`${API_BASE_URL}/cards/${id}/publish`, {
      method: "POST",
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to publish card");
    }
    return response.json();
  },

  // Unpublish a card
  async unpublishCard(id) {
    const response = await fetch(`${API_BASE_URL}/cards/${id}/unpublish`, {
      method: "POST",
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to unpublish card");
    }
    return response.json();
  },

  // Delete a card
  async deleteCard(id) {
    const response = await fetch(`${API_BASE_URL}/cards/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Failed to delete card");
    return response.json();
  },

  // Delete all cards by creator
  async deleteCardsByCreator(createdBy) {
    const response = await fetch(`${API_BASE_URL}/cards/delete-by-creator`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ createdBy }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to delete cards");
    }
    return response.json();
  },

  // Update creator name for all cards
  async updateCreatorName(oldName, newName) {
    const response = await fetch(`${API_BASE_URL}/cards/update-creator`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ oldName, newName }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to update creator name");
    }
    return response.json();
  },
};
