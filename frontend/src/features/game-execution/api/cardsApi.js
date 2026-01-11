const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Fetch all cards for a game
 */
export const fetchCards = async (gameId) => {
  const response = await fetch(`${API_URL}/api/games/${gameId}/cards`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('authToken')}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch cards');
  }

  const data = await response.json();
  return data.cards || [];
};

/**
 * Fetch cards for a specific player in a game
 */
export const fetchPlayerCards = async (gameId, playerId) => {
  const response = await fetch(`${API_URL}/api/games/${gameId}/cards/player/${playerId}`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('authToken')}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch player cards');
  }

  const data = await response.json();
  return data.cards || [];
};

/**
 * Create a new card
 */
export const createCard = async (gameId, cardData) => {
  const response = await fetch(`${API_URL}/api/games/${gameId}/cards`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${localStorage.getItem('authToken')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(cardData),
  });

  if (!response.ok) {
    const error = await response.json();
    // Prefer detailed error message if available, fallback to generic message
    throw new Error(error.error || error.message || 'Failed to create card');
  }

  const data = await response.json();
  return data.card;
};

/**
 * Update an existing card
 */
export const updateCard = async (gameId, cardId, cardData) => {
  const response = await fetch(`${API_URL}/api/games/${gameId}/cards/${cardId}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${localStorage.getItem('authToken')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(cardData),
  });

  if (!response.ok) {
    const error = await response.json();
    // Prefer detailed error message if available, fallback to generic message
    throw new Error(error.error || error.message || 'Failed to update card');
  }

  const data = await response.json();
  return data.card;
};

/**
 * Delete a card
 */
export const deleteCard = async (gameId, cardId) => {
  const response = await fetch(`${API_URL}/api/games/${gameId}/cards/${cardId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${localStorage.getItem('authToken')}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete card');
  }

  return true;
};
