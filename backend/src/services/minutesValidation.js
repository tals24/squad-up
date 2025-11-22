/**
 * Minutes Validation Service
 * 
 * Utility functions for match duration calculation and validation.
 * Note: Minutes validation for manual entry is no longer needed since minutes
 * are automatically calculated from game events (substitutions, red cards).
 */

/**
 * Calculate total match duration including extra time
 * @param {Object} matchDuration - { regularTime, firstHalfExtraTime, secondHalfExtraTime }
 * @returns {Number} - Total match duration in minutes
 */
const calculateTotalMatchDuration = (matchDuration) => {
  const regularTime = matchDuration?.regularTime || 90;
  const firstHalfExtra = matchDuration?.firstHalfExtraTime || 0;
  const secondHalfExtra = matchDuration?.secondHalfExtraTime || 0;
  
  return regularTime + firstHalfExtra + secondHalfExtra;
};

/**
 * Validate extra time values
 * @param {Number} extraTime - Extra time in minutes
 * @param {String} halfName - "first half" or "second half"
 * @returns {Object} - { isValid: boolean, error: string }
 */
const validateExtraTime = (extraTime, halfName) => {
  if (extraTime < 0) {
    return {
      isValid: false,
      error: `Extra time for ${halfName} cannot be negative`
    };
  }
  
  if (extraTime > 15) {
    return {
      isValid: false,
      error: `Extra time for ${halfName} (${extraTime} minutes) is unusually high. Maximum recommended is 15 minutes.`
    };
  }
  
  return { isValid: true };
};

module.exports = {
  calculateTotalMatchDuration,
  validateExtraTime
};

