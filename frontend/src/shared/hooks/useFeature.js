import { useMemo } from 'react';
import { useData } from '@/app/providers/DataProvider';

/**
 * Hook to check if a feature is enabled for a specific team
 *
 * Priority Logic:
 * 1. Check Age Group Override (if teamId provided)
 * 2. Fallback to Global Feature Setting
 *
 * Performance: Uses memoized age group map to avoid repeated team lookups
 *
 * @param {string} featureName - Feature name (e.g., 'shotTrackingEnabled')
 * @param {string|null} teamId - Optional team ID to check age group override
 * @returns {boolean} - Whether the feature is enabled
 *
 * @example
 * const showShotTracking = useFeature('shotTrackingEnabled', game.team);
 * const showPositionMetrics = useFeature('positionSpecificMetricsEnabled', game.team);
 */
export const useFeature = (featureName, teamId = null) => {
  const { organizationConfig, teams } = useData();

  // Performance optimization: Cache age group lookups
  const teamAgeGroupMap = useMemo(() => {
    const map = new Map();
    teams.forEach((team) => {
      const ageGroup = inferAgeGroupFromTeam(team);
      if (ageGroup) {
        // Store by both _id and teamID for flexible lookup
        map.set(team._id, ageGroup);
        if (team.teamID) {
          map.set(team.teamID, ageGroup);
        }
      }
    });
    return map;
  }, [teams]);

  return useMemo(() => {
    // If config not loaded, return false (safe default)
    if (!organizationConfig) {
      console.log(
        `🔍 [useFeature] "${featureName}": organizationConfig not loaded, returning false`
      );
      return false;
    }

    // Get global feature value
    const globalEnabled = organizationConfig.features?.[featureName] || false;
    console.log(
      `🔍 [useFeature] "${featureName}": globalEnabled = ${globalEnabled}, features =`,
      organizationConfig.features
    );

    // If no teamId provided, return global value
    if (!teamId) {
      console.log(
        `🔍 [useFeature] "${featureName}": No teamId, returning global value: ${globalEnabled}`
      );
      return globalEnabled;
    }

    // Get age group from cached map
    const ageGroup = teamAgeGroupMap.get(teamId);

    if (!ageGroup) {
      // No age group found, return global value
      return globalEnabled;
    }

    // Check for age group override
    const override = organizationConfig.ageGroupOverrides?.find((o) => o.ageGroup === ageGroup);

    if (override && override[featureName] !== null && override[featureName] !== undefined) {
      // Age group override exists and is not null
      return override[featureName];
    }

    // No override found, return global value
    return globalEnabled;
  }, [featureName, teamId, organizationConfig, teamAgeGroupMap]);
};

/**
 * Helper function to infer age group from team
 * Matches backend logic in backend/src/utils/ageGroupUtils.js
 *
 * @param {Object} team - Team object with teamName
 * @returns {string|null} - Age group string or null if not found
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

  // Option 3: Check team.ageGroupId (future enhancement)
  // if (team.ageGroupId) {
  //   return team.ageGroupId;
  // }

  return null;
}
