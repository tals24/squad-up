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
 * @param {Object} params.localPlayerReports - Player reports state
 * @param {Function} params.setLocalPlayerReports - Set player reports
 * @param {Object} params.localPlayerMatchStats - Player match stats
 * @param {Function} params.setLocalPlayerMatchStats - Set match stats
 * @param {Object} params.selectedPlayer - Currently selected player
 * @param {Function} params.setSelectedPlayer - Set selected player for dialog
 * @param {Object} params.playerPerfData - Performance data for dialog
 * @param {Function} params.setPlayerPerfData - Set performance data
 * @param {Function} params.setShowPlayerPerfDialog - Show/hide dialog
 * @param {Function} params.setSelectedSummaryType - Set summary type
 * @param {Function} params.setShowTeamSummaryDialog - Show/hide summary dialog
 * @param {Object} params.teamStats - Pre-fetched team stats
 * @param {Object} params.teamSummary - Team summary object
 * @param {Function} params.setTeamSummary - Set team summary
 * @param {Function} params.needsReport - Check if player needs report
 * @param {Function} params.toast - Toast notification function
 *
 * @returns {Object} Report handlers
 */
export function useReportHandlers({
  gameId,
  game,
  gamePlayers,
  localPlayerReports,
  setLocalPlayerReports,
  localPlayerMatchStats,
  setLocalPlayerMatchStats,
  selectedPlayer,
  setSelectedPlayer,
  playerPerfData,
  setPlayerPerfData,
  setShowPlayerPerfDialog,
  setSelectedSummaryType,
  setShowTeamSummaryDialog,
  teamStats,
  teamSummary,
  setTeamSummary,
  needsReport,
  toast,
}) {
  /**
   * Open performance dialog for a player
   */
  const handleOpenPerformanceDialog = (player) => {
    setSelectedPlayer(player);
    const existingReport = localPlayerReports[player._id] || {};
    const playerStats = teamStats[player._id] || {};
    const playerMatchStat = localPlayerMatchStats[player._id] || {};

    // Debug logging for "Done" games
    if (game?.status === 'Done') {
      console.log('🔍 [useReportHandlers] Opening dialog for Done game:', {
        playerId: player._id,
        playerName: player.fullName,
        existingReport,
        hasMinutesPlayed: existingReport.minutesPlayed !== undefined,
        hasGoals: existingReport.goals !== undefined,
        hasAssists: existingReport.assists !== undefined,
      });
    }

    // Load ALL detailed stats from localPlayerMatchStats (nested structure)
    const savedDetailedStats = playerMatchStat || {};

    const playerPerfDataToSet = {
      // User-editable fields
      rating_physical: existingReport.rating_physical || 3,
      rating_technical: existingReport.rating_technical || 3,
      rating_tactical: existingReport.rating_tactical || 3,
      rating_mental: existingReport.rating_mental || 3,
      notes: existingReport.notes || '',
      // ALL Detailed Stats from localPlayerMatchStats (draftable, nested structure)
      stats: {
        fouls: savedDetailedStats.fouls || { committedRating: 0, receivedRating: 0 },
        shooting: savedDetailedStats.shooting || { volumeRating: 0, accuracyRating: 0 },
        passing: savedDetailedStats.passing || {
          volumeRating: 0,
          accuracyRating: 0,
          keyPassesRating: 0,
        },
        duels: savedDetailedStats.duels || { involvementRating: 0, successRating: 0 },
      },
      // Stats from teamStats (read-only, calculated by server)
      // Try both 'minutes' and 'minutesPlayed' keys
      minutesPlayed: playerStats.minutesPlayed || playerStats.minutes || 0,
      goals: playerStats.goals || 0,
      assists: playerStats.assists || 0,
    };

    console.log('🔍 [useReportHandlers] Opening player dialog:', {
      playerId: player._id,
      playerName: player.fullName,
      hasLocalPlayerMatchStats: Object.keys(localPlayerMatchStats).length > 0,
      playerMatchStatKeys: Object.keys(playerMatchStat),
      savedDetailedStats: savedDetailedStats,
      teamStatsKeys: Object.keys(teamStats),
      teamStatsForPlayer: playerStats,
      minutesFromTeamStats: playerStats.minutesPlayed || playerStats.minutes,
      goalsFromTeamStats: playerStats.goals,
      assistsFromTeamStats: playerStats.assists,
      gameStatus: game?.status,
      finalDataToSet: playerPerfDataToSet,
    });

    setPlayerPerfData(playerPerfDataToSet);
    setShowPlayerPerfDialog(true);
  };

  /**
   * Save individual player performance report
   */
  const handleSavePerformanceReport = async () => {
    if (!selectedPlayer) return;

    // Save ratings and notes to localPlayerReports
    setLocalPlayerReports((prev) => ({
      ...prev,
      [selectedPlayer._id]: {
        rating_physical: playerPerfData.rating_physical,
        rating_technical: playerPerfData.rating_technical,
        rating_tactical: playerPerfData.rating_tactical,
        rating_mental: playerPerfData.rating_mental,
        notes: playerPerfData.notes || null,
      },
    }));

    // Save ALL detailed stats to localPlayerMatchStats (will be autosaved to draft)
    // Keep nested structure: {fouls: {...}, shooting: {...}, passing: {...}, duels: {...}}
    const detailedStats = playerPerfData.stats || {};
    console.log('💾 [useReportHandlers] Saving detailed stats:', {
      playerId: selectedPlayer._id,
      playerName: selectedPlayer.fullName,
      stats: detailedStats,
    });
    setLocalPlayerMatchStats((prev) => ({
      ...prev,
      [selectedPlayer._id]: detailedStats,
    }));

    try {
      // Build payload: ONLY user-editable fields
      const reportPayload = {
        playerId: selectedPlayer._id,
        rating_physical: playerPerfData.rating_physical,
        rating_technical: playerPerfData.rating_technical,
        rating_tactical: playerPerfData.rating_tactical,
        rating_mental: playerPerfData.rating_mental,
        notes: playerPerfData.notes || null,
      };

      // DO NOT send: minutesPlayed, goals, assists (server calculates)
      // DO NOT send: foulsCommitted, foulsReceived (saved to draft, will be saved on final submission)

      try {
        await apiClient.post(`/api/game-reports/batch`, {
          gameId,
          reports: [reportPayload],
        });
      } catch (error) {
        console.error(
          '[useReportHandlers] Failed to save performance report:',
          error.message || 'Unknown error'
        );
      }
    } catch (error) {
      console.error('[useReportHandlers] Error saving performance report:', error);
    }

    setShowPlayerPerfDialog(false);
    setSelectedPlayer(null);
  };

  /**
   * Auto-fill missing reports with default values
   */
  const handleAutoFillRemaining = () => {
    if (!gamePlayers || gamePlayers.length === 0) return;
    if (game?.status !== 'Played') return;

    // Identify players without reports
    const playersWithoutReports = gamePlayers.filter((player) => !localPlayerReports[player._id]);

    if (playersWithoutReports.length === 0) {
      toast({
        title: 'No players to fill',
        description: 'All players already have reports.',
        variant: 'default',
      });
      return;
    }

    // Create default reports for missing players
    const updates = {};
    playersWithoutReports.forEach((player) => {
      updates[player._id] = {
        rating_physical: 3,
        rating_technical: 3,
        rating_tactical: 3,
        rating_mental: 3,
        notes: '',
      };
    });

    setLocalPlayerReports((prev) => ({ ...prev, ...updates }));

    toast({
      title: 'Reports auto-filled',
      description: `Created default reports for ${playersWithoutReports.length} player(s).`,
      variant: 'default',
    });
  };

  /**
   * Open team summary dialog
   */
  const handleTeamSummaryClick = (summaryType) => {
    const currentValue = teamSummary[`${summaryType}Summary`] || '';
    console.log('🔍 [useReportHandlers] Team summary clicked:', {
      summaryType,
      fullKey: `${summaryType}Summary`,
      currentValue,
      fullTeamSummary: teamSummary,
      willSetDialog: true,
    });
    setSelectedSummaryType(summaryType);
    setShowTeamSummaryDialog(true);
    console.log('✅ [useReportHandlers] Team summary dialog state updated');
  };

  /**
   * Save team summary
   */
  const handleTeamSummarySave = (summaryType, value) => {
    console.log('💾 [useReportHandlers] Saving team summary:', {
      summaryType,
      fullKey: `${summaryType}Summary`,
      value,
    });
    setTeamSummary((prev) => ({
      ...prev,
      [`${summaryType}Summary`]: value, // defense -> defenseSummary
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
