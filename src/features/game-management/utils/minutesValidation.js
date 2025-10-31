/**
 * Frontend Minutes Validation Utilities
 * 
 * Client-side validation for player minutes before server submission
 */

/**
 * Calculate total match duration including extra time
 * @param {Object} matchDuration - { regularTime, firstHalfExtraTime, secondHalfExtraTime }
 * @returns {Number} - Total match duration in minutes
 */
export const calculateTotalMatchDuration = (matchDuration) => {
  // 🔍 DEBUG: Log input
  console.log('🔍 [calculateTotalMatchDuration] Input:', matchDuration);
  
  if (!matchDuration) {
    console.log('🔍 [calculateTotalMatchDuration] No matchDuration, returning default 90');
    return 90; // Default to 90 minutes
  }
  
  const regularTime = matchDuration.regularTime || 90;
  const firstHalfExtra = matchDuration.firstHalfExtraTime || 0;
  const secondHalfExtra = matchDuration.secondHalfExtraTime || 0;
  
  const total = regularTime + firstHalfExtra + secondHalfExtra;
  
  // 🔍 DEBUG: Log calculation
  console.log('🔍 [calculateTotalMatchDuration] Calculation:', {
    regularTime,
    firstHalfExtra,
    secondHalfExtra,
    total
  });
  
  return total;
};

/**
 * Calculate minimum team minutes required (11 players × match duration)
 * @param {Number} matchDuration - Total match duration
 * @returns {Number} - Minimum team minutes
 */
export const calculateMinimumTeamMinutes = (matchDuration) => {
  const PLAYERS_ON_PITCH = 11;
  return PLAYERS_ON_PITCH * matchDuration;
};

/**
 * Calculate total minutes from player reports
 * @param {Object} playerReports - Object with playerId as keys and report data as values
 * @returns {Number} - Total minutes
 */
export const calculateTotalPlayerMinutes = (playerReports) => {
  return Object.values(playerReports).reduce((total, report) => {
    return total + (report.minutesPlayed || 0);
  }, 0);
};

/**
 * Validate team total minutes (maximum allowed)
 * @param {Number} totalMinutes - Total minutes recorded
 * @param {Number} maximumMinutes - Maximum allowed minutes (11 * matchDuration)
 * @returns {Object} - { isValid, message, excess }
 */
export const validateTeamMaxMinutes = (totalMinutes, maximumMinutes) => {
  if (totalMinutes > maximumMinutes) {
    const excess = totalMinutes - maximumMinutes;
    return {
      isValid: false,
      message: `Total minutes (${totalMinutes}) exceed maximum allowed (${maximumMinutes}). This is ${excess} minutes more than physically possible.`,
      excess
    };
  }
  return {
    isValid: true,
    message: "Team minutes within maximum limit"
  };
};

/**
 * Validate team total minutes (minimum required)
 * @param {Number} totalMinutes - Total minutes recorded
 * @param {Number} minimumMinutes - Minimum required minutes
 * @returns {Object} - { isValid, message, deficit }
 */
export const validateTeamMinutes = (totalMinutes, minimumMinutes) => {
  if (totalMinutes < minimumMinutes) {
    const deficit = minimumMinutes - totalMinutes;
    return {
      isValid: false,
      message: `Total team minutes (${totalMinutes}) is less than required (${minimumMinutes}). Missing ${deficit} minutes.`,
      deficit,
      needsConfirmation: false // This is an error, not a warning
    };
  }
  
  return {
    isValid: true,
    message: "Team minutes meet minimum requirement",
    needsConfirmation: false
  };
};

/**
 * Validate individual player minutes
 * @param {Number} minutesPlayed - Minutes played by player
 * @param {Number} maxMinutes - Maximum allowed minutes
 * @returns {Object} - { isValid, message }
 */
export const validatePlayerMaxMinutes = (minutesPlayed, maxMinutes) => {
  if (minutesPlayed > maxMinutes) {
    return {
      isValid: false,
      message: `Player cannot play more than ${maxMinutes} minutes (recorded: ${minutesPlayed})`
    };
  }
  
  return {
    isValid: true,
    message: "Player minutes within limit"
  };
};

/**
 * Get minutes summary for display
 * @param {Object} playerReports - Player reports object
 * @param {Object} game - Game object with matchDuration
 * @returns {Object} - Summary statistics
 */
export const getMinutesSummary = (playerReports, game) => {
  // 🔍 DEBUG: Log inputs
  console.log('🔍 [getMinutesSummary] Inputs:', {
    hasGame: !!game,
    gameMatchDuration: game?.matchDuration,
    hasPlayerReports: !!playerReports,
    playerReportsCount: playerReports ? Object.keys(playerReports).length : 0
  });
  
  const matchDuration = calculateTotalMatchDuration(game?.matchDuration);
  const minimumRequired = calculateMinimumTeamMinutes(matchDuration);
  const maximumAllowed = minimumRequired; // Maximum = minimum (11 * matchDuration, no substitutions can exceed this)
  const totalRecorded = calculateTotalPlayerMinutes(playerReports);
  
  // 🔍 DEBUG: Log calculations
  console.log('🔍 [getMinutesSummary] Calculations:', {
    matchDuration,
    minimumRequired,
    maximumAllowed,
    totalRecorded,
    expectedMinimumFor96Min: 11 * 96,
    expectedMinimumFor90Min: 11 * 90
  });
  const deficit = Math.max(0, minimumRequired - totalRecorded);
  const excess = Math.max(0, totalRecorded - maximumAllowed); // Excess over maximum
  
  const playersWithMinutes = Object.values(playerReports).filter(
    r => r.minutesPlayed > 0
  ).length;
  
  const percentage = minimumRequired > 0 
    ? Math.round((totalRecorded / minimumRequired) * 100)
    : 0;
  
  const isOverMaximum = totalRecorded > maximumAllowed;
  
  return {
    matchDuration,
    minimumRequired,
    maximumAllowed,
    totalRecorded,
    deficit,
    excess,
    playersReported: Object.keys(playerReports).length,
    playersWithMinutes,
    percentage,
    isValid: totalRecorded >= minimumRequired && !isOverMaximum,
    isSufficient: totalRecorded >= minimumRequired,
    isOverMaximum, // NEW: true if total exceeds maximum allowed
    isExcessive: excess > (minimumRequired * 0.2) // More than 20% over minimum
  };
};

/**
 * Validate minutes before final submission
 * @param {Object} playerReports - Player reports object
 * @param {Object} game - Game object
 * @param {Array} startingLineup - Array of starting lineup players
 * @returns {Object} - Comprehensive validation result
 */
export const validateMinutesForSubmission = (playerReports, game, startingLineup) => {
  const errors = [];
  const warnings = [];
  
  const matchDuration = calculateTotalMatchDuration(game?.matchDuration);
  const minimumRequired = calculateMinimumTeamMinutes(matchDuration);
  const maximumAllowed = minimumRequired; // Maximum = minimum (11 * matchDuration)
  const totalRecorded = calculateTotalPlayerMinutes(playerReports);
  
  // 1. Validate team total minutes (minimum)
  const teamValidation = validateTeamMinutes(totalRecorded, minimumRequired);
  if (!teamValidation.isValid) {
    errors.push(teamValidation.message);
  }
  
  // 2. Validate team total minutes (maximum) - NEW
  const teamMaxValidation = validateTeamMaxMinutes(totalRecorded, maximumAllowed);
  if (!teamMaxValidation.isValid) {
    errors.push(teamMaxValidation.message);
  }
  
  // 3. Validate individual player max minutes (check ALL players, not just starting lineup)
  Object.entries(playerReports).forEach(([playerId, report]) => {
    if (!report.minutesPlayed) return; // Skip if no minutes recorded
    
    const playerValidation = validatePlayerMaxMinutes(report.minutesPlayed, matchDuration);
    if (!playerValidation.isValid) {
      // Try to find player name from starting lineup or use ID
      const player = startingLineup?.find(p => p._id === playerId);
      const playerName = player?.fullName || player?.name || `Player ${playerId.slice(-4)}`;
      errors.push(`${playerName}: ${playerValidation.message}`);
    }
  });
  
  // 4. Check for suspicious patterns (warnings)
  const playersWithZeroMinutes = Object.entries(playerReports).filter(
    ([, report]) => report.minutesPlayed === 0
  ).length;
  
  if (playersWithZeroMinutes > 0 && playersWithZeroMinutes < Object.keys(playerReports).length) {
    warnings.push(`${playersWithZeroMinutes} player(s) have 0 minutes recorded`);
  }
  
  // 5. Check for excessive minutes (possible over-counting)
  const excessPercentage = ((totalRecorded - minimumRequired) / minimumRequired) * 100;
  if (excessPercentage > 20 && totalRecorded > minimumRequired) {
    warnings.push(
      `Total minutes (${totalRecorded}) significantly exceeds minimum (${minimumRequired}). ` +
      `This is ${Math.round(excessPercentage)}% over the expected amount.`
    );
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    summary: {
      totalRecorded,
      minimumRequired,
      matchDuration,
      deficit: Math.max(0, minimumRequired - totalRecorded)
    }
  };
};

/**
 * Format minutes for display
 * @param {Number} minutes - Minutes to format
 * @returns {String} - Formatted string (e.g., "90 min" or "1h 30min")
 */
export const formatMinutes = (minutes) => {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (mins === 0) {
    return `${hours}h`;
  }
  
  return `${hours}h ${mins}min`;
};

/**
 * Get color indicator for minutes progress
 * @param {Number} percentage - Percentage of minimum completed
 * @returns {String} - Color class
 */
export const getMinutesProgressColor = (percentage) => {
  if (percentage >= 100) return 'text-green-400';
  if (percentage >= 80) return 'text-yellow-400';
  return 'text-red-400';
};

