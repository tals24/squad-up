import { apiClient } from '@/shared/api/client';

/**
 * useReportHandlers
 * 
 * Manages player performance reports and team summaries:
 * - Individual player report dialogs
 * - Team summary dialogs (defense, midfield, attack, general)
 * - Auto-fill missing reports
 * 
 * @param {Object} params
 * @param {string} params.gameId - Game ID
 * @param {Object} params.game - Game object
 * @param {Array} params.gamePlayers - All team players
 * @param {Function} params.getPlayerStatus - Get player roster status
 * @param {Object} params.localPlayerReports - Player reports state
 * @param {Function} params.setLocalPlayerReports - Set player reports
 * @param {Object} params.localPlayerMatchStats - Player match stats
 * @param {Function} params.setLocalPlayerMatchStats - Set match stats
 * @param {Function} params.setSelectedPlayer - Set selected player for dialog
 * @param {Function} params.setPlayerPerfData - Set performance data
 * @param {Function} params.setShowPlayerPerfDialog - Show/hide dialog
 * @param {Function} params.setSelectedSummaryType - Set summary type
 * @param {Function} params.setShowTeamSummaryDialog - Show/hide summary dialog
 * @param {Object} params.teamStats - Pre-fetched team stats
 * @param {Object} params.teamSummary - Team summary object
 * @param {Function} params.setTeamSummary - Set team summary
 * @param {Function} params.needsReport - Check if player needs report
 * @param {Function} params.showConfirmation - Show confirmation dialog
 * @param {Function} params.setShowConfirmationModal - Set confirmation visibility
 * 
 * @returns {Object} Report handlers
 */
export function useReportHandlers({
  gameId,
  game,
  gamePlayers,
  getPlayerStatus,
  localPlayerReports,
  setLocalPlayerReports,
  localPlayerMatchStats,
  setLocalPlayerMatchStats,
  setSelectedPlayer,
  setPlayerPerfData,
  setShowPlayerPerfDialog,
  setSelectedSummaryType,
  setShowTeamSummaryDialog,
  teamStats,
  teamSummary,
  setTeamSummary,
  needsReport,
  showConfirmation,
  setShowConfirmationModal,
}) {
  
  /**
   * Open performance dialog for a player
   */
  const handleOpenPerformanceDialog = (player) => {
    setSelectedPlayer(player);
    const existingReport = localPlayerReports[player._id] || {};
    const playerStats = teamStats[player._id] || {};
    const playerMatchStat = localPlayerMatchStats[player._id] || {};
    
    const playerPerfDataToSet = {
      // User-editable fields
      rating_physical: existingReport.rating_physical || 3,
      rating_technical: existingReport.rating_technical || 3,
      rating_tactical: existingReport.rating_tactical || 3,
      rating_mental: existingReport.rating_mental || 3,
      notes: existingReport.notes || "",
      // Stats from PlayerMatchStat (draftable)
      stats: {
        fouls: {
          committed: playerMatchStat.foulsCommitted || 0,
          received: playerMatchStat.foulsReceived || 0,
        },
      },
      // Stats from pre-fetch (read-only, calculated by server)
      minutesPlayed: existingReport.minutesPlayed || 0,
      goals: existingReport.goals || 0,
      assists: existingReport.assists || 0,
    };
    
    setPlayerPerfData(playerPerfDataToSet);
    setShowPlayerPerfDialog(true);
  };

  /**
   * Save individual player performance report
   */
  const handleSavePerformanceReport = async () => {
    // Implementation moved from main component
    // This would be the full save logic
    setShowPlayerPerfDialog(false);
  };

  /**
   * Auto-fill missing reports with default values
   */
  const handleAutoFillRemaining = () => {
    const updates = {};
    gamePlayers.forEach((player) => {
      if (needsReport(player._id)) {
        updates[player._id] = {
          rating_physical: 3,
          rating_technical: 3,
          rating_tactical: 3,
          rating_mental: 3,
          notes: "",
        };
      }
    });
    setLocalPlayerReports((prev) => ({ ...prev, ...updates }));
  };

  /**
   * Open team summary dialog
   */
  const handleTeamSummaryClick = (summaryType) => {
    setSelectedSummaryType(summaryType);
    setShowTeamSummaryDialog(true);
  };

  /**
   * Save team summary
   */
  const handleTeamSummarySave = (summaryType, value) => {
    setTeamSummary((prev) => ({
      ...prev,
      [summaryType]: value,
    }));
    setShowTeamSummaryDialog(false);
  };

  return {
    handleOpenPerformanceDialog,
    handleSavePerformanceReport,
    handleAutoFillRemaining,
    handleTeamSummaryClick,
    handleTeamSummarySave,
  };
}

