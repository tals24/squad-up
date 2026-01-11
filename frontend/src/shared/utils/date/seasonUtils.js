/**
 * Utility functions for football season management
 * Seasons run from August to May of the following year
 * Format: "2024/2025" for August 2024 to May 2025
 */

/**
 * Get the season for a given date
 * @param {Date|string} date - The game date
 * @returns {string} Season in format "YYYY/YYYY"
 */
export const getSeasonFromDate = (date) => {
  const gameDate = new Date(date);
  const year = gameDate.getFullYear();
  const month = gameDate.getMonth() + 1; // getMonth() returns 0-11, we need 1-12

  // Season logic:
  // August (8) to December (12) → Current year/Next year
  // January (1) to May (5) → Previous year/Current year
  // June (6) to July (7) → Current year/Next year (transition period)

  if (month >= 8) {
    // August to December: 2024/2025
    return `${year}/${year + 1}`;
  } else if (month >= 1 && month <= 5) {
    // January to May: 2023/2024
    return `${year - 1}/${year}`;
  } else {
    // June to July: 2024/2025 (transition to next season)
    return `${year}/${year + 1}`;
  }
};

/**
 * Get the current season based on today's date
 * @returns {string} Current season in format "YYYY/YYYY"
 */
export const getCurrentSeason = () => {
  return getSeasonFromDate(new Date());
};

/**
 * Get available seasons for dropdown (current and next)
 * @returns {Array} Array of season objects with value and label
 */
export const getAvailableSeasons = () => {
  const currentSeason = getCurrentSeason();
  const currentYear = parseInt(currentSeason.split('/')[0]);
  const nextSeason = `${currentYear + 1}/${currentYear + 2}`;

  return [
    { value: currentSeason, label: currentSeason },
    { value: nextSeason, label: nextSeason },
  ];
};

/**
 * Validate if a date is within a season
 * @param {Date|string} date - The date to validate
 * @param {string} season - The season to check against (format: "YYYY/YYYY")
 * @returns {boolean} True if date is within the season
 */
export const isDateInSeason = (date, season) => {
  const seasonStart = season.split('/')[0];
  const seasonEnd = season.split('/')[1];

  const gameDate = new Date(date);
  const gameYear = gameDate.getFullYear();
  const gameMonth = gameDate.getMonth() + 1;

  const startYear = parseInt(seasonStart);
  const endYear = parseInt(seasonEnd);

  // Check if date falls within the season range
  if (gameMonth >= 8) {
    // August to December: should be startYear/endYear
    return gameYear === startYear;
  } else if (gameMonth >= 1 && gameMonth <= 5) {
    // January to May: should be startYear/endYear (endYear is the actual year)
    return gameYear === endYear;
  } else {
    // June to July: transition period, could be either season
    return gameYear === startYear || gameYear === endYear;
  }
};
