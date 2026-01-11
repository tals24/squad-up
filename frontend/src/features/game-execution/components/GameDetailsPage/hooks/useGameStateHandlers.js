import { useState } from 'react';
import { apiClient } from '@/shared/api/client';
import {
  validateSquad,
  validateReportCompleteness,
  validateStartingLineup,
  validateGoalkeeper,
} from '../../../utils/squadValidation';

/**
 * useGameStateHandlers
 *
 * Manages all game state transition handlers:
 * - Scheduled → Played (handleGameWasPlayed)
 * - Played → Done (handleSubmitFinalReport, handleConfirmFinalSubmission)
 * - Done → Played (handleEditReport)
 * - Any → Postponed (handlePostpone)
 *
 * This hook encapsulates all the complex logic for game state transitions,
 * including validation, confirmation dialogs, API calls, and state updates.
 *
 * @param {Object} params
 * @param {string} params.gameId - Game ID
 * @param {Object} params.game - Current game object
 * @param {Object} params.formation - Current formation (position -> player mapping)
 * @param {string} params.formationType - Formation type (e.g., "1-4-4-2")
 * @param {Array} params.gamePlayers - All players for the team
 * @param {Array} params.benchPlayers - Players on bench
 * @param {Object} params.localRosterStatuses - Player roster statuses
 * @param {Function} params.getPlayerStatus - Helper to get player status
 * @param {Object} params.finalScore - Final score object
 * @param {Object} params.matchDuration - Match duration object
 * @param {Object} params.teamSummary - Team summary object
 * @param {Object} params.localPlayerReports - Player reports
 * @param {Object} params.localPlayerMatchStats - Player match stats
 * @param {Object} params.difficultyAssessment - Difficulty assessment
 * @param {boolean} params.isDifficultyAssessmentEnabled - Feature flag
 * @param {Array} params.games - Games array from DataProvider
 * @param {Function} params.updateGameInCache - Update game in cache
 * @param {Function} params.updateGameRostersInCache - Update gameRosters in cache
 * @param {Function} params.refreshData - Refresh all data
 * @param {Function} params.setGame - Set game state
 * @param {Function} params.setIsReadOnly - Set read-only mode
 * @param {Function} params.setIsFinalizingGame - Set finalizing state
 * @param {Function} params.setIsSaving - Set saving state
 * @param {Function} params.showConfirmation - Show confirmation dialog
 * @param {Function} params.setShowConfirmationModal - Set confirmation modal visibility
 * @param {Function} params.setPendingAction - Set pending action
 * @param {Function} params.toast - Toast notification function
 *
 * @returns {Object} Game state handlers
 */
export function useGameStateHandlers({
  gameId,
  game,
  formation,
  formationType,
  gamePlayers,
  benchPlayers,
  localRosterStatuses,
  getPlayerStatus,
  finalScore,
  matchDuration,
  teamSummary,
  localPlayerReports,
  localPlayerMatchStats,
  difficultyAssessment,
  isDifficultyAssessmentEnabled,
  games,
  updateGameInCache,
  updateGameRostersInCache,
  refreshData,
  setGame,
  setIsReadOnly,
  setIsFinalizingGame,
  setIsSaving,
  showConfirmation,
  setShowConfirmationModal,
  setPendingAction,
  toast,
}) {
  /**
   * Validate "Played" status requirements
   * Comprehensive validation for finalizing a game
   */
  const validatePlayedStatus = () => {
    console.log('🔍 [useGameStateHandlers] validatePlayedStatus called');
    const errors = [];
    const warnings = [];

    // Validate report completion
    // Get starting lineup players (filter gamePlayers by roster status)
    const startingLineupPlayers = gamePlayers.filter((player) => {
      const status = getPlayerStatus(player._id);
      return status === 'Starting Lineup';
    });

    console.log('🔍 [useGameStateHandlers] Starting lineup players:', {
      count: startingLineupPlayers.length,
      players: startingLineupPlayers.map((p) => p.fullName),
    });
    console.log('🔍 [useGameStateHandlers] Local player reports:', localPlayerReports);

    const reportValidation = validateReportCompleteness(startingLineupPlayers, localPlayerReports);
    console.log('🔍 [useGameStateHandlers] Report validation result:', reportValidation);

    if (!reportValidation.isValid) {
      errors.push(`❌ Missing Reports:\n${reportValidation.message}`);
    }

    // Validate final score
    if (finalScore.ourScore === 0 && finalScore.opponentScore === 0) {
      warnings.push('⚠️ Final score is 0-0. Is this correct?');
    }

    // Validate team summaries
    const hasAnySummary =
      teamSummary.defenseSummary ||
      teamSummary.midfieldSummary ||
      teamSummary.attackSummary ||
      teamSummary.generalSummary;
    if (!hasAnySummary) {
      warnings.push('⚠️ No team summary provided. Consider adding performance notes.');
    }

    const messages = [...errors, ...warnings];
    return {
      isValid: errors.length === 0,
      hasErrors: errors.length > 0,
      hasWarnings: warnings.length > 0,
      messages,
    };
  };

  /**
   * Execute the actual game was played logic (atomic operation)
   * Transitions game from Scheduled to Played
   */
  const executeGameWasPlayed = async () => {
    setIsFinalizingGame(true); // Show blocking modal
    setIsSaving(true);
    try {
      // Build rosters object: { playerId: status }
      const rostersObject = {};
      gamePlayers.forEach((player) => {
        const status = getPlayerStatus(player._id);
        if (status !== 'Not in Squad') {
          rostersObject[player._id] = status;
        }
      });

      // Clean formation: remove null/empty positions and keep only valid player IDs
      const cleanFormation = {};
      Object.entries(formation).forEach(([position, player]) => {
        if (player && player._id && player._id !== '0') {
          cleanFormation[position] = player._id;
        }
      });

      console.log('🔍 [useGameStateHandlers] Starting game with roster:', {
        gameId,
        rosterCount: Object.keys(rostersObject).length,
        startingLineupCount: Object.values(rostersObject).filter((s) => s === 'Starting Lineup')
          .length,
        benchCount: Object.values(rostersObject).filter((s) => s === 'Bench').length,
        formationPositions: Object.keys(cleanFormation).length,
      });

      // API call to start game
      const result = await apiClient.post(`/api/games/${gameId}/start-game`, {
        rosters: rostersObject,
        formation: cleanFormation,
        formationType: formationType,
      });
      console.log('✅ [useGameStateHandlers] Game started successfully:', result);

      // Update game state from response (DEFENSIVE MERGE - preserve all existing fields)
      if (result.data?.game) {
        const updatedGameData = {
          _id: result.data.game._id,
          status: result.data.game.status,
          lineupDraft: result.data.game.lineupDraft ?? null,
        };

        if (result.data.game.gameTitle) {
          updatedGameData.gameTitle = result.data.game.gameTitle;
        }

        // Update local state (defensive merge)
        setGame((prev) => {
          if (!prev) {
            console.warn(
              '⚠️ [useGameStateHandlers] No previous game state, using response data only'
            );
            return updatedGameData;
          }

          const updated = {
            ...prev,
            ...updatedGameData,
          };

          console.log('✅ [useGameStateHandlers] Local game state updated (defensive merge)');
          return updated;
        });

        // Update global DataProvider cache immediately
        const existingGameInCache = games.find((g) => g._id === result.data.game._id);
        updateGameInCache({
          ...(existingGameInCache || {}),
          ...updatedGameData,
        });
        console.log('✅ [useGameStateHandlers] Global game cache updated');
      }

      // Update gameRosters in cache (CRITICAL for navigation without refresh)
      if (result.data?.gameRosters && Array.isArray(result.data.gameRosters)) {
        updateGameRostersInCache(result.data.gameRosters, gameId);
        console.log('✅ [useGameStateHandlers] GameRosters cache updated:', {
          gameId,
          rostersCount: result.data.gameRosters.length,
        });
      } else {
        console.warn('⚠️ [useGameStateHandlers] No gameRosters in response, cache not updated');
      }

      toast({
        title: 'Success',
        description: 'Game marked as played successfully',
      });
    } catch (error) {
      console.error('[useGameStateHandlers] Error starting game:', error);
      showConfirmation({
        title: 'Error',
        message: error.message || 'Failed to mark game as played. Please try again.',
        confirmText: 'OK',
        cancelText: null,
        onConfirm: () => setShowConfirmationModal(false),
        onCancel: null,
        type: 'warning',
      });
    } finally {
      setIsSaving(false);
      setIsFinalizingGame(false);
    }
  };

  /**
   * Check bench validation and proceed with game was played
   */
  const checkBenchAndProceed = async (squadValidation) => {
    if (squadValidation.needsConfirmation) {
      setPendingAction(() => executeGameWasPlayed);
      showConfirmation({
        title: 'Bench Size Warning',
        message: squadValidation.bench.confirmationMessage,
        confirmText: 'Continue',
        cancelText: 'Go Back',
        onConfirm: () => executeGameWasPlayed(),
        onCancel: () => {},
        type: 'warning',
      });
    } else {
      await executeGameWasPlayed();
    }
  };

  /**
   * Handle "Game Was Played" button click
   * Validates squad and transitions from Scheduled to Played
   */
  const handleGameWasPlayed = async () => {
    if (!game) return;

    // Run squad validation
    const squadValidation = validateSquad(formation, benchPlayers, localRosterStatuses);
    console.log('🔍 [useGameStateHandlers] Validation result:', squadValidation);

    // Check if starting lineup is valid (mandatory 11 players)
    if (!squadValidation.startingLineup.isValid) {
      showConfirmation({
        title: 'Invalid Starting Lineup',
        message: `❌ Cannot mark game as played: ${squadValidation.startingLineup.message}`,
        confirmText: 'OK',
        cancelText: null,
        onConfirm: () => setShowConfirmationModal(false),
        onCancel: null,
        type: 'warning',
      });
      return;
    }

    // Check if goalkeeper is assigned
    if (!squadValidation.goalkeeper.hasGoalkeeper) {
      showConfirmation({
        title: 'Missing Goalkeeper',
        message: `❌ Cannot mark game as played: ${squadValidation.goalkeeper.message}`,
        confirmText: 'OK',
        cancelText: null,
        onConfirm: () => setShowConfirmationModal(false),
        onCancel: null,
        type: 'warning',
      });
      return;
    }

    // Check if difficulty assessment is incomplete (if feature is enabled)
    if (
      isDifficultyAssessmentEnabled &&
      (!difficultyAssessment || !difficultyAssessment.overallScore)
    ) {
      showConfirmation({
        title: 'Difficulty Assessment Not Completed',
        message:
          "⚠️ You haven't completed the difficulty assessment for this game.\n\nDo you want to continue without completing it?",
        confirmText: 'Continue Anyway',
        cancelText: 'Go Back',
        onConfirm: () => checkBenchAndProceed(squadValidation),
        onCancel: () => {},
        type: 'warning',
      });
      return;
    }

    // If difficulty assessment is complete (or feature disabled), check bench validation
    await checkBenchAndProceed(squadValidation);
  };

  /**
   * Handle postpone game
   * Transitions game to Postponed status
   */
  const handlePostpone = async () => {
    if (!game) return;

    setIsSaving(true);
    try {
      await apiClient.put(`/api/games/${gameId}`, { status: 'Postponed' });
      await refreshData();
      window.location.href = '/GamesSchedule';
    } catch (error) {
      console.error('[useGameStateHandlers] Error postponing game:', error);
      showConfirmation({
        title: 'Error',
        message: 'Failed to postpone game',
        confirmText: 'OK',
        cancelText: null,
        onConfirm: () => setShowConfirmationModal(false),
        onCancel: null,
        type: 'warning',
      });
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Handle submit final report
   * Validates Played game and shows confirmation for finalization
   */
  const handleSubmitFinalReport = async () => {
    console.log('🔍 [useGameStateHandlers] handleSubmitFinalReport called');
    const validation = validatePlayedStatus();
    console.log('🔍 [useGameStateHandlers] Validation result:', validation);

    if (validation.hasErrors) {
      showConfirmation({
        title: 'Validation Errors',
        message: validation.messages.join('\n\n'),
        confirmText: 'OK',
        cancelText: null,
        onConfirm: () => setShowConfirmationModal(false),
        onCancel: null,
        type: 'warning',
      });
      return;
    }

    // Show confirmation
    let confirmMessage = 'Are you sure you want to finalize this game? This will:\n\n';
    confirmMessage += '✅ Lock all game data\n';
    confirmMessage += '✅ Update player statistics\n';
    confirmMessage += '✅ Calculate team performance metrics\n\n';

    if (validation.hasWarnings) {
      confirmMessage += '⚠️ Warnings:\n' + validation.messages.join('\n') + '\n\n';
    }

    confirmMessage += 'You can still edit the report later if needed.';

    console.log('✅ [useGameStateHandlers] Opening final report dialog');
    setShowFinalReportDialog(true);
  };

  /**
   * Handle confirm final submission
   * Actually finalizes the game (Played → Done)
   */
  const handleConfirmFinalSubmission = async () => {
    setIsSaving(true);
    try {
      const requestBody = {
        status: 'Done',
        ourScore: finalScore.ourScore,
        opponentScore: finalScore.opponentScore,
        matchDuration: matchDuration,
        defenseSummary: teamSummary.defenseSummary,
        midfieldSummary: teamSummary.midfieldSummary,
        attackSummary: teamSummary.attackSummary,
        generalSummary: teamSummary.generalSummary,
      };

      console.log('🔍 [useGameStateHandlers] Finalizing game:', requestBody);

      // Update game status and summaries
      const responseData = await apiClient.put(`/api/games/${gameId}`, requestBody);

      console.log('🔍 [useGameStateHandlers] Backend response:', responseData);

      // Build report updates: ONLY user-editable fields
      const reportUpdates = Object.entries(localPlayerReports).map(([playerId, report]) => ({
        playerId,
        rating_physical: report.rating_physical || 3,
        rating_technical: report.rating_technical || 3,
        rating_tactical: report.rating_tactical || 3,
        rating_mental: report.rating_mental || 3,
        notes: report.notes || '',
      }));

      // Save reports
      await apiClient.post(`/api/game-reports/batch`, { gameId, reports: reportUpdates });

      // Save player match stats from draft to PlayerMatchStat collection
      if (localPlayerMatchStats && Object.keys(localPlayerMatchStats).length > 0) {
        try {
          const statsPromises = Object.entries(localPlayerMatchStats).map(
            async ([playerId, stats]) => {
              // Only save if player has stats
              if (stats && (stats.foulsCommitted > 0 || stats.foulsReceived > 0)) {
                const { upsertPlayerMatchStats } = await import('../../../api/playerMatchStatsApi');
                await upsertPlayerMatchStats(gameId, playerId, stats);
                console.log(`✅ [useGameStateHandlers] Saved match stats for player ${playerId}`);
              }
            }
          );
          await Promise.all(statsPromises);
        } catch (statsError) {
          console.error('[useGameStateHandlers] Error saving player match stats:', statsError);
        }
      }

      // Update local state
      setIsReadOnly(true);
      setGame((prev) => ({ ...prev, status: 'Done' }));

      // Close the dialog
      setShowFinalReportDialog(false);

      toast({
        title: 'Success',
        description: 'Game finalized successfully',
      });

      // Refresh data to get updated stats
      await refreshData();
    } catch (error) {
      console.error('[useGameStateHandlers] Error finalizing game:', error);
      showConfirmation({
        title: 'Error',
        message: error.message || 'Failed to finalize game. Please try again.',
        confirmText: 'OK',
        cancelText: null,
        onConfirm: () => setShowConfirmationModal(false),
        onCancel: null,
        type: 'warning',
      });
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Handle edit report
   * Re-opens a Done game for editing (Done → Played)
   */
  const handleEditReport = () => {
    setIsReadOnly(false);
    setGame((prev) => ({ ...prev, status: 'Played' }));
  };

  // Expose this for the confirmation dialog
  const [showFinalReportDialog, setShowFinalReportDialog] = useState(false);

  return {
    handleGameWasPlayed,
    handlePostpone,
    handleSubmitFinalReport,
    handleConfirmFinalSubmission,
    handleEditReport,
    showFinalReportDialog,
    setShowFinalReportDialog,
  };
}
