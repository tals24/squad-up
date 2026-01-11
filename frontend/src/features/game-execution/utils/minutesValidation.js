/**
 * Frontend Minutes Utilities
 *
 * Utility functions for match duration calculation.
 * Note: Minutes validation is no longer needed since minutes are automatically calculated
 * from game events (substitutions, red cards).
 */

/**
 * Calculate total match duration including extra time
 * @param {Object} matchDuration - { regularTime, firstHalfExtraTime, secondHalfExtraTime }
 * @returns {Number} - Total match duration in minutes
 */
export const calculateTotalMatchDuration = (matchDuration) => {
  if (!matchDuration) {
    return 90; // Default to 90 minutes
  }

  const regularTime = matchDuration.regularTime || 90;
  const firstHalfExtra = matchDuration.firstHalfExtraTime || 0;
  const secondHalfExtra = matchDuration.secondHalfExtraTime || 0;

  return regularTime + firstHalfExtra + secondHalfExtra;
};
