/**
 * Squad Validation Utilities
 * 
 * Contains validation logic for sports team squad management
 * including formation validation, bench size checks, and position validation
 */

/**
 * Validates if the starting lineup has exactly 11 players
 * @param {Object} formation - The current formation object
 * @returns {Object} - { isValid: boolean, message: string }
 */
export const validateStartingLineup = (formation) => {
  if (!formation || typeof formation !== 'object') {
    return {
      isValid: false,
      message: "No players assigned to starting lineup"
    };
  }
  
  const playersOnPitch = Object.values(formation).filter(player => player !== null && player !== undefined);
  
  if (playersOnPitch.length === 0) {
    return {
      isValid: false,
      message: "No players assigned to starting lineup"
    };
  }
  
  if (playersOnPitch.length < 11) {
    return {
      isValid: false,
      message: `Only ${playersOnPitch.length} players in starting lineup. Need exactly 11 players.`
    };
  }
  
  if (playersOnPitch.length > 11) {
    return {
      isValid: false,
      message: `Too many players (${playersOnPitch.length}) in starting lineup. Maximum 11 players allowed.`
    };
  }
  
  return {
    isValid: true,
    message: "Starting lineup is valid"
  };
};

/**
 * Validates if there are at least 6 players on the bench
 * @param {Array} benchPlayers - Array of players on the bench
 * @returns {Object} - { isValid: boolean, message: string, needsConfirmation: boolean }
 */
export const validateBenchSize = (benchPlayers) => {
  if (!benchPlayers || !Array.isArray(benchPlayers)) {
    return {
      isValid: true,
      message: "No players on the bench",
      needsConfirmation: true,
      confirmationMessage: "You have no players on the bench. Are you sure you want to continue?"
    };
  }
  
  const benchCount = benchPlayers.length;
  
  if (benchCount >= 7) {
    return {
      isValid: true,
      message: "Bench size is adequate",
      needsConfirmation: false
    };
  }
  
  if (benchCount === 0) {
    return {
      isValid: true,
      message: "No players on the bench",
      needsConfirmation: true,
      confirmationMessage: "You have no players on the bench. Are you sure you want to continue?"
    };
  }
  
  return {
    isValid: true,
    message: `Only ${benchCount} players on bench (recommended: 7+)`,
    needsConfirmation: true,
    confirmationMessage: "You have fewer than 7 bench players. Are you sure you want to continue?"
  };
};

/**
 * Validates if a player is being placed in their natural position
 * @param {Object} player - The player object
 * @param {Object} positionData - The position data object
 * @returns {Object} - { isNaturalPosition: boolean, message: string }
 */
export const validatePlayerPosition = (player, positionData) => {
  if (!player || !positionData) {
    return {
      isNaturalPosition: true,
      message: "Position validation passed"
    };
  }
  
  const playerPosition = player.position?.toLowerCase();
  const positionType = positionData.type?.toLowerCase();
  const positionLabel = positionData.label?.toLowerCase();
  
  // Define position mappings
  const positionMappings = {
    'goalkeeper': ['gk', 'goalkeeper'],
    'defender': ['cb', 'lb', 'rb', 'lcb', 'rcb', 'defender', 'centre-back', 'left-back', 'right-back'],
    'midfielder': ['cm', 'lm', 'rm', 'cam', 'cdm', 'lcm', 'rcm', 'midfielder', 'centre-mid', 'left-mid', 'right-mid', 'attacking-mid', 'defensive-mid'],
    'forward': ['st', 'cf', 'lw', 'rw', 'forward', 'striker', 'centre-forward', 'left-wing', 'right-wing']
  };
  
  // Check if player position matches the position type or label
  const isNaturalPosition = 
    positionMappings[playerPosition]?.includes(positionType) ||
    positionMappings[playerPosition]?.includes(positionLabel) ||
    playerPosition === positionType ||
    playerPosition === positionLabel;
  
  if (isNaturalPosition) {
    return {
      isNaturalPosition: true,
      message: `${player.name} is in their natural position`
    };
  }
  
  return {
    isNaturalPosition: false,
    message: `${player.name} is being placed out of their natural position (${player.position} → ${positionData.label})`
  };
};

/**
 * Validates if a goalkeeper is assigned
 * @param {Object} formation - The current formation object
 * @returns {Object} - { hasGoalkeeper: boolean, message: string }
 */
export const validateGoalkeeper = (formation) => {
  if (!formation || typeof formation !== 'object') {
    return {
      hasGoalkeeper: false,
      message: "No goalkeeper assigned to the team"
    };
  }
  
  const gkPosition = formation.gk;
  
  if (!gkPosition) {
    return {
      hasGoalkeeper: false,
      message: "No goalkeeper assigned to the team"
    };
  }
  
  return {
    hasGoalkeeper: true,
    message: "Goalkeeper is assigned"
  };
};

/**
 * Comprehensive squad validation
 * @param {Object} formation - The current formation
 * @param {Array} benchPlayers - Array of bench players
 * @param {Object} localRosterStatuses - Player statuses
 * @returns {Object} - Complete validation result
 */
export const validateSquad = (formation, benchPlayers, localRosterStatuses) => {
  const startingLineupValidation = validateStartingLineup(formation);
  const benchValidation = validateBenchSize(benchPlayers);
  const goalkeeperValidation = validateGoalkeeper(formation);
  
  const isValid = 
    startingLineupValidation.isValid && 
    benchValidation.isValid && 
    goalkeeperValidation.hasGoalkeeper;
  
  return {
    isValid,
    startingLineup: startingLineupValidation,
    bench: benchValidation,
    goalkeeper: goalkeeperValidation,
    needsConfirmation: benchValidation.needsConfirmation,
    messages: [
      startingLineupValidation.message,
      benchValidation.message,
      goalkeeperValidation.message
    ]
  };
};

/**
 * Validates that starting lineup players have minutes played
 * @param {Array} startingLineup - Array of players in starting lineup
 * @param {Object} playerReports - Object containing player reports by player ID
 * @returns {Object} - { isValid: boolean, message: string, needsConfirmation: boolean }
 */
export const validateMinutesPlayed = (startingLineup, playerReports) => {
  if (!startingLineup || startingLineup.length === 0) {
    return {
      isValid: false,
      message: "No starting lineup players found",
      needsConfirmation: false
    };
  }

  const playersWithoutMinutes = startingLineup.filter(player => {
    const report = playerReports[player._id];
    const minutes = report?.minutesPlayed || 0;
    return minutes <= 0;
  });

  if (playersWithoutMinutes.length > 0) {
    const playerNames = playersWithoutMinutes.map(p => p.fullName || p.name).join(", ");
    return {
      isValid: false,
      message: `Starting lineup players must have minutes played: ${playerNames}`,
      needsConfirmation: false
    };
  }

  return {
    isValid: true,
    message: "All starting lineup players have minutes played",
    needsConfirmation: false
  };
};

/**
 * Validates goals scored consistency
 * @param {Object} teamScore - { ourScore: number, opponentScore: number }
 * @param {Object} playerReports - Object containing player reports by player ID
 * @returns {Object} - { isValid: boolean, message: string, needsConfirmation: boolean }
 */
export const validateGoalsScored = (teamScore, playerReports) => {
  if (!teamScore || teamScore.ourScore === null || teamScore.ourScore === undefined) {
    return {
      isValid: false,
      message: "Team score must be entered",
      needsConfirmation: false
    };
  }

  if (!playerReports || Object.keys(playerReports).length === 0) {
    return {
      isValid: false,
      message: "Player reports not found",
      needsConfirmation: false
    };
  }

  // Calculate total goals scored by players
  // Support both 'goalsScored' and 'goals' field names for compatibility
  const totalPlayerGoals = Object.values(playerReports).reduce((total, report) => {
    const goals = report?.goalsScored || report?.goals || 0;
    return total + goals;
  }, 0);

  const teamGoals = teamScore.ourScore;

  // Calculate total assists across all players
  const totalAssists = Object.values(playerReports).reduce((total, report) => {
    const assists = report?.assists || 0;
    return total + assists;
  }, 0);

  // Error case: Total assists exceed team goals (impossible)
  // Every assist must correspond to a goal scored by the team
  if (totalAssists > teamGoals) {
    return {
      isValid: false,
      message: `Total assists (${totalAssists}) cannot exceed team goals (${teamGoals}). Every assist must correspond to a goal scored by the team.`,
      needsConfirmation: false
    };
  }

  // Error case: Player goals exceed team score (impossible)
  if (totalPlayerGoals > teamGoals) {
    return {
      isValid: false,
      message: `Player goals (${totalPlayerGoals}) exceed team score (${teamGoals}). Please correct the player goal data.`,
      needsConfirmation: false
    };
  }

  // Warning case: Team score higher than player goals (own goals possible)
  if (teamGoals > totalPlayerGoals) {
    const ownGoals = teamGoals - totalPlayerGoals;
    return {
      isValid: true,
      message: `Team scored ${teamGoals} goals, but players only scored ${totalPlayerGoals} goals`,
      needsConfirmation: true,
      confirmationMessage: `Team scored ${teamGoals} goals, but players only scored ${totalPlayerGoals} goals. This suggests ${ownGoals} own goals. Are you sure this is correct?`
    };
  }

  // Perfect match
  return {
    isValid: true,
    message: "Goals scored match team score",
    needsConfirmation: false
  };
};

/**
 * Validates report completeness for starting lineup players
 * @param {Array} startingLineup - Array of players in starting lineup
 * @param {Object} playerReports - Object containing player reports by player ID
 * @returns {Object} - { isValid: boolean, message: string, needsConfirmation: boolean }
 */
export const validateReportCompleteness = (startingLineup, playerReports) => {
  if (!startingLineup || startingLineup.length === 0) {
    return {
      isValid: false,
      message: "No starting lineup players found",
      needsConfirmation: false
    };
  }

  const playersWithoutReports = startingLineup.filter(player => {
    const report = playerReports[player._id];
    return !report || !report.minutesPlayed;
  });

  if (playersWithoutReports.length > 0) {
    const playerNames = playersWithoutReports.map(p => p.fullName || p.name).join(", ");
    return {
      isValid: false,
      message: `Starting lineup players must have complete reports: ${playerNames}`,
      needsConfirmation: false
    };
  }

  return {
    isValid: true,
    message: "All starting lineup players have complete reports",
    needsConfirmation: false
  };
};
