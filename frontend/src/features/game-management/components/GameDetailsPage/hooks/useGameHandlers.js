import { useEffect } from 'react';

import { upsertPlayerMatchStats } from '../../../api/playerMatchStatsApi';

/**
 * Custom hook for GameDetailsPage event handlers
 * Consolidates all handler functions to reduce main component size
 */
export function useGameHandlers({
  game,
  gameId,
  gamePlayers,
  getPlayerStatus,
  formation,
  setFormation,
  formationType,
  validateSquadForPlayed,
  isDifficultyAssessmentEnabled,
  difficultyAssessment,
  showConfirmation,
  setShowConfirmationModal,
  setIsFinalizingGame,
  setIsSaving,
  isSaving,
  updateGameInCache,
  refreshData,
  setGame,
  validatePlayedStatus,
  areAllTeamSummariesFilled,
  localPlayerReports,
  localPlayerMatchStats,
  setShowFinalReportDialog,
  selectedPlayer,
  playerPerfData,
  setPlayerPerfData,
  setShowPlayerPerfDialog,
  openGoalDialog,
  openSubstitutionDialog,
  openCardDialog,
  openPlayerSelectionDialog,
  setSelectedPosition,
  setSelectedPositionData,
  setShowPlayerSelectionDialog,
  updatePlayerStatus,
  setManualFormationMode,
  selectedPosition,
  setLocalRosterStatuses,
  updateGameRostersInCache,
  matchDuration,
}) {
  // Game state transitions
  const handleGameWasPlayed = async () => {
    if (!game) return;
    
    const validation = validateSquadForPlayed();
    
    if (!validation.isValid) {
      showConfirmation({
        title: "Invalid Squad",
        message: validation.error,
        confirmText: "OK",
        cancelText: null,
        onConfirm: () => setShowConfirmationModal(false),
        onCancel: null,
        type: "warning"
      });
      return;
    }
    
    if (isDifficultyAssessmentEnabled && (!difficultyAssessment || !difficultyAssessment.overallScore)) {
      showConfirmation({
        title: "Difficulty Assessment Not Completed",
        message: "⚠️ You haven't completed the difficulty assessment for this game. Do you want to continue without completing it?",
        confirmText: "Continue Anyway",
        cancelText: "Go Back",
        onConfirm: () => executeGameWasPlayed(),
        onCancel: () => {},
        type: "warning"
      });
      return;
    }

    if (validation.needsConfirmation) {
      showConfirmation({
        title: "Bench Size Warning",
        message: validation.confirmationMessage,
        confirmText: "Continue",
        cancelText: "Go Back",
        onConfirm: () => executeGameWasPlayed(),
        onCancel: () => {},
        type: "warning"
      });
      return;
    }
    
    await executeGameWasPlayed();
  };

  const executeGameWasPlayed = async () => {
    setIsFinalizingGame(true);
    setIsSaving(true);
    
    try {
      const rostersObject = {};
      gamePlayers.forEach((player) => {
        const status = getPlayerStatus(player._id);
        if (status !== 'Not in Squad') {
          rostersObject[player._id] = status;
        }
      });

      const cleanFormation = {};
      Object.entries(formation).forEach(([position, player]) => {
        if (player && player._id && player._id !== '0') {
          cleanFormation[position] = player._id;
        }
      });

      const response = await fetch(`http://localhost:3001/api/games/${gameId}/start-game`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("authToken")}`,
        },
        body: JSON.stringify({ 
          rosters: rostersObject,
          formation: cleanFormation,
          formationType: formationType
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `Failed to start game: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.data?.game) {
        const updatedGameData = {
          _id: result.data.game._id,
          status: result.data.game.status,
          lineupDraft: result.data.game.lineupDraft ?? null,
        };
        
        if (result.data.game.gameTitle) {
          updatedGameData.gameTitle = result.data.game.gameTitle;
        }
        if (result.data.game.opponentName) {
          updatedGameData.opponentName = result.data.game.opponentName;
        }
        
        updateGameInCache(gameId, updatedGameData);
        setGame((prev) => ({ ...prev, ...updatedGameData }));
        await refreshData();
      }

      // Step 2: Update localRosterStatuses directly from response rosters
      if (result.data?.rosters && Array.isArray(result.data.rosters)) {
        const statuses = {};
        
        // Extract statuses from response rosters
        result.data.rosters.forEach((roster) => {
          const playerId = typeof roster.player === "object" 
            ? roster.player._id 
            : roster.player;
          statuses[playerId] = roster.status;
        });
        
        // Ensure all gamePlayers have a status (default to "Not in Squad" if missing)
        gamePlayers.forEach((player) => {
          if (!statuses[player._id]) {
            statuses[player._id] = "Not in Squad";
          }
        });
        
        console.log('✅ Updated roster statuses from response:', {
          rosterCount: result.data.rosters.length,
          statusesCount: Object.keys(statuses).length,
        });
        
        setLocalRosterStatuses(statuses);

        // Update global gameRosters cache immediately
        updateGameRostersInCache(result.data.rosters, gameId);
        console.log('✅ [State Update] Global gameRosters cache updated');
      }

      alert("Game status changed to 'Played' successfully!");
    } catch (error) {
      console.error("Error updating game status:", error);
      alert(error.message || "Failed to update game status. Please try again.");
    } finally {
      setIsFinalizingGame(false);
      setIsSaving(false);
    }
  };

  const handlePostpone = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`http://localhost:3001/api/games/${gameId}/postpone`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("authToken")}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to postpone game: ${response.status}`);
      }

      updateGameInCache(gameId, { status: "Scheduled" });
      setGame((prev) => ({ ...prev, status: "Scheduled" }));
      await refreshData();
      alert("Game postponed successfully!");
    } catch (error) {
      console.error("Error postponing game:", error);
      alert("Failed to postpone game. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmitFinalReport = () => {
    if (isSaving) return;

    const validation = validatePlayedStatus();
    
    if (!validation.isValid) {
      alert(validation.error);
      return;
    }

    if (!areAllTeamSummariesFilled()) {
      alert("⚠️ Please fill in all team summaries (Attack, Defense, Midfield) before submitting the final report.");
      return;
    }

    setShowFinalReportDialog(true);
  };

  const handleConfirmFinalSubmission = async () => {
    setIsSaving(true);
    setIsFinalizingGame(true);

    try {
      const playerMatchStatsArray = Object.entries(localPlayerMatchStats).map(([playerId, stats]) => ({
        playerId,
        gameId,
        ...stats,
      }));

      await Promise.all(
        playerMatchStatsArray.map((stat) => upsertPlayerMatchStats(gameId, stat.playerId, stat))
      );

      const reportsObject = {};
      Object.entries(localPlayerReports).forEach(([playerId, report]) => {
        reportsObject[playerId] = {
          rating_physical: report.rating_physical,
          rating_technical: report.rating_technical,
          rating_tactical: report.rating_tactical,
          rating_mental: report.rating_mental,
          notes: report.notes,
        };
      });

      const response = await fetch(`http://localhost:3001/api/games/${gameId}/finalize`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("authToken")}`,
        },
        body: JSON.stringify({
          reports: reportsObject,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.data?.game) {
        // Preserve matchDuration when updating game status
        const updatedGameData = {
          status: result.data.game.status,
          lineupDraft: null,
          matchDuration: matchDuration, // Preserve the matchDuration state
        };
        
        updateGameInCache(gameId, updatedGameData);
        setGame((prev) => ({ 
          ...prev, 
          status: result.data.game.status, 
          lineupDraft: null,
          matchDuration: matchDuration // Preserve the matchDuration state
        }));
        await refreshData();
      }

      setShowFinalReportDialog(false);
      
      // Show success confirmation dialog
      showConfirmation({
        title: "Success",
        message: "Final report submitted successfully! Game status is now 'Done'.",
        confirmText: "OK",
        cancelText: null,
        onConfirm: () => setShowConfirmationModal(false),
        onCancel: null,
        type: "success"
      });
    } catch (error) {
      console.error("Error submitting final report:", error);
      
      // Show error confirmation dialog
      const errorMessage = error.message || "Failed to submit final report. Please try again.";
      showConfirmation({
        title: "Error",
        message: errorMessage,
        confirmText: "OK",
        cancelText: null,
        onConfirm: () => setShowConfirmationModal(false),
        onCancel: null,
        type: "warning"
      });
    } finally {
      setIsSaving(false);
      setIsFinalizingGame(false);
    }
  };

  const handleEditReport = () => {
    alert("Edit Report functionality coming soon!");
  };

  const handleOpenPerformanceDialog = (player) => {
    if (!player || !player._id) {
      console.warn('[handleOpenPerformanceDialog] Invalid player:', player);
      return;
    }

    const reportKey = player._id;
    const existingReport = localPlayerReports[reportKey];

    const initialData = existingReport
      ? {
          rating_physical: existingReport.rating_physical ?? 3,
          rating_technical: existingReport.rating_technical ?? 3,
          rating_tactical: existingReport.rating_tactical ?? 3,
          rating_mental: existingReport.rating_mental ?? 3,
          notes: existingReport.notes || "",
        }
      : {
          rating_physical: 3,
          rating_technical: 3,
          rating_tactical: 3,
          rating_mental: 3,
          notes: "",
        };

    setPlayerPerfData(initialData);
    setShowPlayerPerfDialog(true);
    setPlayerPerfData(initialData);
  };

  const handleSavePerformanceReport = async () => {
    if (!selectedPlayer || !selectedPlayer._id) {
      console.error("No player selected");
      return;
    }

    try {
      setPlayerPerfData((prevReports) => ({
        ...prevReports,
        [selectedPlayer._id]: playerPerfData,
      }));

      setShowPlayerPerfDialog(false);
      setPlayerPerfData({});
    } catch (error) {
      console.error("Error saving performance report:", error);
      alert("Failed to save performance report. Please try again.");
    }
  };

  // Event handlers for dialogs
  const handleAddGoal = () => {
    openGoalDialog();
  };

  const handleEditGoal = (goal) => {
    openGoalDialog(goal);
  };

  const handleAddSubstitution = () => {
    openSubstitutionDialog();
  };

  const handleEditSubstitution = (substitution) => {
    openSubstitutionDialog(substitution);
  };

  const handleAddCard = () => {
    openCardDialog();
  };

  const handleEditCard = (card) => {
    openCardDialog(card);
  };

  // Formation handlers
  const handlePositionClick = (posId, posData) => {
    setSelectedPosition(posId);
    setSelectedPositionData(posData);
    setShowPlayerSelectionDialog(true);
  };

  const handleSelectPlayerForPosition = (player) => {
    if (!selectedPosition) return;

    const newFormation = { ...formation };
    Object.keys(newFormation).forEach((posId) => {
      if (newFormation[posId]?._id === player._id) {
        newFormation[posId] = null;
      }
    });

    newFormation[selectedPosition] = player;
    setFormation(newFormation);
    updatePlayerStatus(player._id, "Starting Lineup");
    setManualFormationMode(true);

    setShowPlayerSelectionDialog(false);
    setSelectedPosition(null);
    setSelectedPositionData(null);
  };

  // Prevent navigation during game finalization
  useEffect(() => {
    if (isSaving) {
      const handleBeforeUnload = (e) => {
        e.preventDefault();
        e.returnValue = 'Game finalization in progress. Are you sure you want to leave?';
        return e.returnValue;
      };
      window.addEventListener('beforeunload', handleBeforeUnload);
      return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }
  }, [isSaving]);

  return {
    handleGameWasPlayed,
    handlePostpone,
    handleSubmitFinalReport,
    handleConfirmFinalSubmission,
    handleEditReport,
    handleOpenPerformanceDialog,
    handleSavePerformanceReport,
    handleAddGoal,
    handleEditGoal,
    handleAddSubstitution,
    handleEditSubstitution,
    handleAddCard,
    handleEditCard,
    handlePositionClick,
    handleSelectPlayerForPosition,
  };
}

