/**
 * Utility functions for player position styling
 */

/**
 * Get the appropriate CSS classes for a position badge
 * @param {string} position - The player's position
 * @returns {string} - CSS classes for the badge
 */
export const getPositionBadgeClasses = (position) => {
  const styles = {
    Goalkeeper: 'text-purple-400 border-purple-400',
    Defender: 'text-blue-400 border-blue-400',
    Midfielder: 'text-green-400 border-green-400',
    Forward: 'text-red-400 border-red-400',
    'Wing-back': 'text-yellow-400 border-yellow-400',
    Striker: 'text-orange-400 border-orange-400',
  };
  return styles[position] || 'text-gray-400 border-gray-400';
};

/**
 * Get the appropriate background color for position-based elements
 * @param {string} position - The player's position
 * @returns {string} - Background color class
 */
export const getPositionBackgroundColor = (position) => {
  const colors = {
    Goalkeeper: 'bg-purple-500',
    Defender: 'bg-blue-500',
    Midfielder: 'bg-green-500',
    Forward: 'bg-red-500',
    'Wing-back': 'bg-yellow-500',
    Striker: 'bg-orange-500',
  };
  return colors[position] || 'bg-gray-500';
};

/**
 * Get the appropriate text color for position-based elements
 * @param {string} position - The player's position
 * @returns {string} - Text color class
 */
export const getPositionTextColor = (position) => {
  const colors = {
    Goalkeeper: 'text-purple-400',
    Defender: 'text-blue-400',
    Midfielder: 'text-green-400',
    Forward: 'text-red-400',
    'Wing-back': 'text-yellow-400',
    Striker: 'text-orange-400',
  };
  return colors[position] || 'text-gray-400';
};
