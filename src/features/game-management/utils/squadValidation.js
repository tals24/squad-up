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
