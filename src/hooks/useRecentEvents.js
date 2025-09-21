import { useMemo } from 'react';
import { safeDate, safeIsPast } from '../utils/dateUtils';

/**
 * Custom hook for recent events calculation
 * Handles event sorting, date filtering, and timeline creation
 * 
 * @param {Object} params - Parameters object
 * @param {Array} params.filteredGames - Filtered games for current user
 * @param {Array} params.filteredReports - Filtered reports for current user
 * @returns {Object} - Recent events and loading state
 */
export const useRecentEvents = ({ filteredGames, filteredReports }) => {
  return useMemo(() => {
    // Process past games
    const pastGames = filteredGames
      .filter(game => game.date && safeIsPast(game.date))
      .map(g => ({
        ...g,
        type: 'game',
        eventDate: safeDate(g.date)
      }))
      .filter(g => g.eventDate); // Remove games with invalid dates

    // Process recent reports
    const recentReports = filteredReports
      .filter(r => r.createdAt) // MongoDB uses createdAt field
      .map(r => ({
        ...r,
        type: 'report',
        eventDate: safeDate(r.createdAt)
      }))
      .filter(r => r.eventDate); // Remove reports with invalid dates

    // Combine and sort events
    const recentEvents = [...pastGames, ...recentReports]
      .sort((a, b) => b.eventDate - a.eventDate)
      .slice(0, 4);

    return {
      recentEvents,
      isLoading: false // Could be enhanced with actual loading state
    };
  }, [filteredGames, filteredReports]);
};

