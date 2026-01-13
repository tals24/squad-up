/**
 * Game Result Utilities
 *
 * Pure functions for calculating and displaying game results.
 * These utilities are used across multiple features (analytics, game-management).
 */

/**
 * Determine the result of a game based on final score
 * @param {Object} game - Game object with finalScoreDisplay
 * @returns {string} - 'win', 'loss', 'draw', or 'unknown'
 */
export const getGameResult = (game) => {
  if (!game.finalScoreDisplay) return 'unknown';
  const scores = game.finalScoreDisplay.split('-').map((s) => parseInt(s.trim()));
  if (scores.length !== 2 || isNaN(scores[0]) || isNaN(scores[1])) return 'unknown';
  if (scores[0] > scores[1]) return 'win';
  if (scores[0] < scores[1]) return 'loss';
  return 'draw';
};

/**
 * Get the background color class for a game result
 * @param {string} result - Game result ('win', 'loss', 'draw', 'unknown')
 * @returns {string} - Tailwind CSS background color class
 */
export const getResultColor = (result) => {
  switch (result) {
    case 'win':
      return 'bg-green-500';
    case 'loss':
      return 'bg-red-500';
    case 'draw':
      return 'bg-yellow-500';
    default:
      return 'bg-gray-500';
  }
};

/**
 * Get the text representation for a game result
 * @param {string} result - Game result ('win', 'loss', 'draw', 'unknown')
 * @returns {string} - Single character representation (W, L, D, ?)
 */
export const getResultText = (result) => {
  switch (result) {
    case 'win':
      return 'W';
    case 'loss':
      return 'L';
    case 'draw':
      return 'D';
    default:
      return '?';
  }
};
