import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { useData } from '@/app/providers/DataProvider';
import { ConfirmationModal } from '@/shared/components';
import PageLoader from '@/shared/components/PageLoader';

// Import formations
import { formations } from './formations';

// Import custom hooks
import {
  useGameCore,
  useRosterManagement,
  useFormationManagement,
  useGameEvents,
  usePlayerReports,
  useDifficultyAssessment,
  useGameValidation,
  useTeamSummary,
  useDragAndDrop,
  useDialogManagement,
  useGameHandlers,
  useDerivedGameState,
} from './hooks';

// Import modular components
import GameDetailsHeader from './components/GameDetailsHeader';
import { GameContent } from './modules/GameContent';
import { DialogsContainer } from './modules/DialogsContainer';

export default function GameDetailsPage() {
  const [searchParams] = useSearchParams();
  const gameId = searchParams.get('id');
  const { refreshData, updateGameInCache } = useData();

  // ========================================
  // HOOKS & DATA (Bundled Pattern)
  // ========================================
  
  // Finalization state
  const [isFinalizingGame, setIsFinalizingGame] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Bundle all game state
  const gameCore = useGameCore(gameId);
  const { game, setGame, gamePlayers, isLoading, error, isFetchingGame } = gameCore;

  // Bundle all feature logic
  const roster = useRosterManagement(gameId, game, gamePlayers, isFinalizingGame);
  const formation = useFormationManagement(gamePlayers, roster.localRosterStatuses, game, gameId, isFinalizingGame);
  const events = useGameEvents(gameId, game, gameCore.setFinalScore);
  const reports = usePlayerReports(gameId, game, gamePlayers, roster.localRosterStatuses);
  const difficulty = useDifficultyAssessment(gameId, game);
  const teamSummary = useTeamSummary(game);
  const validation = useGameValidation(formation.formation, [], teamSummary.teamSummary, roster.localRosterStatuses);
  const dragDrop = useDragAndDrop(
    formation.formation,
    formation.setFormation,
    roster.updatePlayerStatus,
    formation.positions,
    formation.setManualFormationMode,
    validation.showConfirmation
  );
  const dialogs = useDialogManagement(game);
  const derivedState = useDerivedGameState({
    formation: formation.formation,
    gamePlayers,
    getPlayerStatus: roster.getPlayerStatus,
    goals: events.goals,
    localPlayerReports: reports.localPlayerReports,
    teamSummary: teamSummary.teamSummary,
    finalScore: gameCore.finalScore,
    matchDuration: gameCore.matchDuration,
    localPlayerMatchStats: reports.localPlayerMatchStats,
  });
  const handlers = useGameHandlers({
    game,
    gameId,
    gamePlayers,
    getPlayerStatus: roster.getPlayerStatus,
    formation: formation.formation,
    setFormation: formation.setFormation,
    formationType: formation.formationType,
    validateSquadForPlayed: validation.validateSquadForPlayed,
    isDifficultyAssessmentEnabled: difficulty.isDifficultyAssessmentEnabled,
    difficultyAssessment: difficulty.difficultyAssessment,
    showConfirmation: validation.showConfirmation,
    setShowConfirmationModal: validation.setShowConfirmationModal,
    setIsFinalizingGame,
    setIsSaving,
    isSaving,
    updateGameInCache,
    refreshData,
    setGame,
    validatePlayedStatus: validation.validatePlayedStatus,
    areAllTeamSummariesFilled: validation.areAllTeamSummariesFilled,
    localPlayerReports: reports.localPlayerReports,
    localPlayerMatchStats: reports.localPlayerMatchStats,
    setShowFinalReportDialog: dialogs.setShowFinalReportDialog,
    selectedPlayer: dialogs.selectedPlayer,
    playerPerfData: dialogs.playerPerfData,
    setPlayerPerfData: dialogs.setPlayerPerfData,
    setShowPlayerPerfDialog: dialogs.setShowPlayerPerfDialog,
    openGoalDialog: dialogs.openGoalDialog,
    openSubstitutionDialog: dialogs.openSubstitutionDialog,
    openCardDialog: dialogs.openCardDialog,
    openPlayerSelectionDialog: dialogs.openPlayerSelectionDialog,
    setSelectedPosition: dialogs.setSelectedPosition,
    setSelectedPositionData: dialogs.setSelectedPositionData,
    setShowPlayerSelectionDialog: dialogs.setShowPlayerSelectionDialog,
    updatePlayerStatus: roster.updatePlayerStatus,
    setManualFormationMode: formation.setManualFormationMode,
    selectedPosition: dialogs.selectedPosition,
    setLocalRosterStatuses: roster.setLocalRosterStatuses,
    updateGameRostersInCache: roster.updateGameRostersInCache,
    matchDuration: gameCore.matchDuration,
  });

  // Early returns
  if (isLoading || isFetchingGame) return <PageLoader message="Loading game details..." />;
  if (error || !game) return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="text-red-400 text-lg">{error || "Game not found"}</div>
    </div>
  );

  // Render
  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
      {isFinalizingGame && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-slate-800 rounded-2xl p-8 max-w-md mx-4 text-center border border-cyan-500/30 shadow-2xl">
            <div className="w-16 h-16 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h2 className="text-2xl font-bold text-white mb-2">Finalizing Game</h2>
            <p className="text-slate-300 mb-4">Please do not navigate away. This may take a few moments...</p>
            <div className="text-sm text-slate-400">Saving lineup, updating game status, and clearing draft...</div>
          </div>
        </div>
      )}

      <GameDetailsHeader
        gameCore={gameCore}
        reports={reports}
        teamSummary={teamSummary}
        derivedState={derivedState}
        handlers={handlers}
        isSaving={isSaving}
      />

      <GameContent
        gameCore={gameCore}
        roster={roster}
        formation={formation}
        formations={formations}
        events={events}
        reports={reports}
        difficulty={difficulty}
        teamSummary={teamSummary}
        derivedState={derivedState}
        dragDrop={dragDrop}
        dialogs={dialogs}
      />

      <DialogsContainer
        dialogs={dialogs}
        gameCore={gameCore}
        roster={roster}
        formation={formation}
        events={events}
        reports={reports}
        teamSummary={teamSummary}
        derivedState={derivedState}
        handlers={handlers}
        isSaving={isSaving}
      />

      <ConfirmationModal
        open={validation.showConfirmationModal}
        title={validation.confirmationConfig.title}
        message={validation.confirmationConfig.message}
        confirmText={validation.confirmationConfig.confirmText}
        cancelText={validation.confirmationConfig.cancelText}
        onConfirm={validation.handleConfirmation}
        onCancel={validation.handleConfirmationCancel}
        type={validation.confirmationConfig.type}
        isLoading={isSaving}
      />
    </div>
  );
}