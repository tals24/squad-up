const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Fetch difficulty assessment for a game
 * @param {string} gameId - Game ID
 * @returns {Promise<Object>} Difficulty assessment data
 */
export const fetchDifficultyAssessment = async (gameId) => {
  const response = await fetch(`${API_URL}/api/games/${gameId}/difficulty-assessment`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch difficulty assessment');
  }

  const data = await response.json();
  return data.data.difficultyAssessment;
};

/**
 * Update difficulty assessment for a game
 * @param {string} gameId - Game ID
 * @param {Object} assessment - Assessment data
 * @param {number} assessment.opponentStrength - Opponent strength (1-5)
 * @param {number} assessment.matchImportance - Match importance (1-5)
 * @param {number} assessment.externalConditions - External conditions (1-5)
 * @returns {Promise<Object>} Updated difficulty assessment
 */
export const updateDifficultyAssessment = async (gameId, assessment) => {
  const response = await fetch(`${API_URL}/api/games/${gameId}/difficulty-assessment`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(assessment)
  });

  if (!response.ok) {
    throw new Error('Failed to update difficulty assessment');
  }

  const data = await response.json();
  return data.data.difficultyAssessment;
};

/**
 * Delete difficulty assessment for a game
 * @param {string} gameId - Game ID
 * @returns {Promise<void>}
 */
export const deleteDifficultyAssessment = async (gameId) => {
  const response = await fetch(`${API_URL}/api/games/${gameId}/difficulty-assessment`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error('Failed to delete difficulty assessment');
  }
};

