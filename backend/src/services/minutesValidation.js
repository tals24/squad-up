/**
 * Minutes Validation Service
 * 
 * Validates player minutes for match reports ensuring:
 * - Total team minutes meet minimum requirements
 * - Individual players don't exceed match duration
 * - Proper extra time handling
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
 * Calculate minimum team minutes required
 * - 11 players × match duration
 * @param {Number} matchDuration - Total match duration
 * @returns {Number} - Minimum team minutes
 */
const calculateMinimumTeamMinutes = (matchDuration) => {
  const PLAYERS_ON_PITCH = 11;
  return PLAYERS_ON_PITCH * matchDuration;
};

/**
 * Calculate total minutes played by all players
 * @param {Array} playerReports - Array of player reports with minutesPlayed
 * @returns {Number} - Total minutes played
 */
const calculateTotalPlayerMinutes = (playerReports) => {
  return playerReports.reduce((total, report) => {
    return total + (report.minutesPlayed || 0);
  }, 0);
};

/**
 * Validate individual player minutes
 * @param {Number} minutesPlayed - Minutes played by player
 * @param {Number} maxMinutes - Maximum allowed minutes
 * @param {String} playerName - Player name for error message
 * @returns {Object} - { isValid: boolean, error: string }
 */
const validatePlayerMinutes = (minutesPlayed, maxMinutes, playerName) => {
  if (minutesPlayed > maxMinutes) {
    return {
      isValid: false,
      error: `${playerName} cannot play more than ${maxMinutes} minutes (recorded: ${minutesPlayed} minutes)`
    };
  }
  
  if (minutesPlayed < 0) {
    return {
      isValid: false,
      error: `${playerName} cannot have negative minutes (recorded: ${minutesPlayed} minutes)`
    };
  }
  
  return { isValid: true };
};

/**
 * Validate team total minutes
 * @param {Number} totalMinutes - Total minutes played by all players
 * @param {Number} minimumMinutes - Minimum required minutes
 * @returns {Object} - { isValid: boolean, error: string, deficit: number }
 */
const validateTeamTotalMinutes = (totalMinutes, minimumMinutes) => {
  if (totalMinutes < minimumMinutes) {
    const deficit = minimumMinutes - totalMinutes;
    return {
      isValid: false,
      error: `Total team minutes (${totalMinutes}) is less than required minimum (${minimumMinutes}). Missing ${deficit} minutes.`,
      deficit
    };
  }
  
  return { isValid: true };
};

/**
 * Comprehensive minutes validation for a match
 * @param {Object} game - Game object with matchDuration and matchType
 * @param {Array} playerReports - Array of player reports
 * @returns {Object} - Validation result
 */
const validateMatchMinutes = (game, playerReports) => {
  const errors = [];
  const warnings = [];
  
  // Calculate match duration
  const totalMatchDuration = calculateTotalMatchDuration(game.matchDuration);
  const minimumTeamMinutes = calculateMinimumTeamMinutes(totalMatchDuration);
  
  // Calculate total player minutes
  const totalPlayerMinutes = calculateTotalPlayerMinutes(playerReports);
  
  // Validate team total minutes
  const teamValidation = validateTeamTotalMinutes(totalPlayerMinutes, minimumTeamMinutes);
  if (!teamValidation.isValid) {
    errors.push({
      type: 'TEAM_MINUTES_INSUFFICIENT',
      message: teamValidation.error,
      details: {
        totalPlayerMinutes,
        minimumRequired: minimumTeamMinutes,
        deficit: teamValidation.deficit,
        matchDuration: totalMatchDuration
      }
    });
  }
  
  // Validate individual player minutes
  playerReports.forEach((report) => {
    const playerValidation = validatePlayerMinutes(
      report.minutesPlayed,
      totalMatchDuration,
      report.playerName || report.player?.name || 'Unknown Player'
    );
    
    if (!playerValidation.isValid) {
      errors.push({
        type: 'PLAYER_MINUTES_EXCEEDED',
        message: playerValidation.error,
        details: {
          playerId: report.playerId || report.player?._id,
          playerName: report.playerName || report.player?.name,
          minutesPlayed: report.minutesPlayed,
          maxAllowed: totalMatchDuration
        }
      });
    }
  });
  
  // Check for suspicious patterns (warnings, not errors)
  const playersWithZeroMinutes = playerReports.filter(r => r.minutesPlayed === 0);
  if (playersWithZeroMinutes.length > 0 && playersWithZeroMinutes.length < playerReports.length) {
    warnings.push({
      type: 'ZERO_MINUTES_WARNING',
      message: `${playersWithZeroMinutes.length} player(s) have 0 minutes recorded`,
      details: {
        players: playersWithZeroMinutes.map(r => ({
          playerId: r.playerId,
          playerName: r.playerName || r.player?.name
        }))
      }
    });
  }
  
  // Check if total minutes significantly exceed minimum (possible over-counting)
  const excessPercentage = ((totalPlayerMinutes - minimumTeamMinutes) / minimumTeamMinutes) * 100;
  if (excessPercentage > 20) { // More than 20% over minimum
    warnings.push({
      type: 'EXCESSIVE_MINUTES_WARNING',
      message: `Total minutes (${totalPlayerMinutes}) significantly exceeds minimum (${minimumTeamMinutes}). Possible over-counting or multiple substitutions.`,
      details: {
        totalPlayerMinutes,
        minimumRequired: minimumTeamMinutes,
        excess: totalPlayerMinutes - minimumTeamMinutes,
        excessPercentage: Math.round(excessPercentage)
      }
    });
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    summary: {
      totalPlayerMinutes,
      minimumRequired: minimumTeamMinutes,
      matchDuration: totalMatchDuration,
      playersReported: playerReports.length,
      deficit: teamValidation.deficit || 0,
      excess: Math.max(0, totalPlayerMinutes - minimumTeamMinutes)
    }
  };
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

/**
 * Calculate suggested minutes distribution
 * Helps coaches understand how to distribute remaining minutes
 * @param {Number} totalRecorded - Total minutes already recorded
 * @param {Number} minimumRequired - Minimum required minutes
 * @param {Number} playersWithMinutes - Number of players with minutes
 * @returns {Object} - Suggestions for minute distribution
 */
const calculateMinutesSuggestions = (totalRecorded, minimumRequired, playersWithMinutes) => {
  if (totalRecorded >= minimumRequired) {
    return { deficit: 0, suggestions: [] };
  }
  
  const deficit = minimumRequired - totalRecorded;
  const suggestions = [];
  
  // Suggestion 1: Distribute evenly among existing players
  if (playersWithMinutes > 0) {
    const perPlayer = Math.ceil(deficit / playersWithMinutes);
    suggestions.push({
      type: 'distribute-evenly',
      description: `Add approximately ${perPlayer} minutes to each of the ${playersWithMinutes} player(s) already recorded`
    });
  }
  
  // Suggestion 2: Add substitute appearances
  const possibleSubs = Math.ceil(deficit / 30); // Assume 30 min per sub
  if (possibleSubs > 0 && possibleSubs <= 5) {
    suggestions.push({
      type: 'add-substitutes',
      description: `Add ${possibleSubs} substitute appearance(s) (~30 minutes each)`
    });
  }
  
  // Suggestion 3: Check for missing players
  if (playersWithMinutes < 11) {
    suggestions.push({
      type: 'missing-players',
      description: `Only ${playersWithMinutes} players have minutes. Check if any starting lineup players are missing reports.`
    });
  }
  
  return { deficit, suggestions };
};

module.exports = {
  calculateTotalMatchDuration,
  calculateMinimumTeamMinutes,
  calculateTotalPlayerMinutes,
  validatePlayerMinutes,
  validateTeamTotalMinutes,
  validateMatchMinutes,
  validateExtraTime,
  calculateMinutesSuggestions
};

