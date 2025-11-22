/**
 * Utility functions for age group inference and management
 * 
 * This module provides shared logic for determining age groups from team data.
 * Used by both backend routes and potentially frontend (via API).
 */

/**
 * Infer age group from team name or other team properties
 * 
 * Priority:
 * 1. Parse from teamName (e.g., "U14 Team A" -> "U14-U16")
 * 2. Check division field (if it contains age info)
 * 3. Use explicit ageGroupId field (future enhancement)
 * 
 * @param {Object} team - Team object with teamName, division, etc.
 * @returns {string|null} - Age group string ('U6-U8', 'U8-U10', etc.) or null if not found
 * 
 * @example
 * inferAgeGroupFromTeam({ teamName: 'U14 Eagles' }) // Returns 'U12-U14'
 * inferAgeGroupFromTeam({ teamName: 'U16 Lions' }) // Returns 'U14-U16'
 * inferAgeGroupFromTeam({ teamName: 'Senior Team' }) // Returns null
 */
function inferAgeGroupFromTeam(team) {
  if (!team) {
    return null;
  }

  // Option 1: Parse from teamName (e.g., "U14 Team A" -> "U14-U16")
  const teamName = team.teamName || '';
  const ageMatch = teamName.match(/U(\d+)/i);
  
  if (ageMatch) {
    const age = parseInt(ageMatch[1]);
    
    // Map age to age group brackets
    if (age <= 8) return 'U6-U8';
    if (age <= 10) return 'U8-U10';
    if (age <= 12) return 'U10-U12';
    if (age <= 14) return 'U12-U14';
    if (age <= 16) return 'U14-U16';
    return 'U16+';
  }
  
  // Option 2: Check division field (if it contains age info)
  const division = team.division || '';
  const divMatch = division.match(/U(\d+)/i);
  
  if (divMatch) {
    const age = parseInt(divMatch[1]);
    
    if (age <= 8) return 'U6-U8';
    if (age <= 10) return 'U8-U10';
    if (age <= 12) return 'U10-U12';
    if (age <= 14) return 'U12-U14';
    if (age <= 16) return 'U14-U16';
    return 'U16+';
  }
  
  // Option 3: Use explicit ageGroupId field (future enhancement)
  // if (team.ageGroupId) {
  //   return team.ageGroupId;
  // }
  
  return null; // No age group found
}

/**
 * Validate age group string
 * 
 * @param {string} ageGroup - Age group string to validate
 * @returns {boolean} - True if valid age group
 */
function isValidAgeGroup(ageGroup) {
  const validAgeGroups = ['U6-U8', 'U8-U10', 'U10-U12', 'U12-U14', 'U14-U16', 'U16+'];
  return validAgeGroups.includes(ageGroup);
}

/**
 * Get all valid age groups
 * 
 * @returns {string[]} - Array of valid age group strings
 */
function getValidAgeGroups() {
  return ['U6-U8', 'U8-U10', 'U10-U12', 'U12-U14', 'U14-U16', 'U16+'];
}

module.exports = {
  inferAgeGroupFromTeam,
  isValidAgeGroup,
  getValidAgeGroups
};

