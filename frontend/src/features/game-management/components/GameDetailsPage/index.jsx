import React, { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useData } from "@/app/providers/DataProvider";
import { useToast } from "@/shared/ui/primitives/use-toast";
import { useFeature } from "@/shared/hooks";
import { formations } from "./formations";
import { ConfirmationModal } from "@/shared/components";
import PageLoader from "@/shared/components/PageLoader";
import { validatePlayerPosition } from "../../utils/squadValidation";
import {
  GameHeaderModule, RosterSidebarModule, TacticalBoardModule,
  MatchAnalysisModule, DialogsModule
} from "./modules";
import {
  useGameDetailsData, useLineupDraftManager, useReportDraftManager,
  usePlayerGrouping, useFormationAutoBuild, useTacticalBoardDragDrop,
  useGameStateHandlers, useReportHandlers, useGoalsHandlers,
  useSubstitutionsHandlers, useCardsHandlers, useFormationHandlers,
  useDifficultyHandlers, useDialogState, useEntityLoading,
} from "./hooks";

export default function GameDetails() {
  const [searchParams] = useSearchParams();
  const gameId = searchParams.get("id");
  const { games, players, teams, gameRosters, gameReports, refreshData, isLoading, error, updateGameInCache, updateGameRostersInCache } = useData();
  const { toast } = useToast();
  const isDifficultyAssessmentEnabled = useFeature("difficultyAssessment");

  // Formation state (required early for hooks)
  const [formationType, setFormationType] = useState("1-4-4-2");
  const [formation, setFormation] = useState({});
  const [manualFormationMode, setManualFormationMode] = useState(false);
  const positions = useMemo(() => formations[formationType]?.positions || {}, [formationType]);
  const [isFinalizingGame, setIsFinalizingGame] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Data loading hooks
  const { game, gamePlayers, isFetchingGame, matchDuration, finalScore, teamSummary, isReadOnly, setGame, setMatchDuration, setFinalScore, setTeamSummary, setIsReadOnly } = useGameDetailsData(gameId, { games, players, teams });
  const { localRosterStatuses, setLocalRosterStatuses, isAutosaving, autosaveError } = useLineupDraftManager({ gameId, game, gamePlayers, gameRosters, isFinalizingGame, formation, setFormation, formationType, setFormationType, manualFormationMode, setManualFormationMode });
  const [localPlayerReports, setLocalPlayerReports] = useState({});
  const [localPlayerMatchStats, setLocalPlayerMatchStats] = useState({});
  const { isAutosavingReport, reportAutosaveError } = useReportDraftManager({ gameId, game, isFinalizingGame, teamSummary, setTeamSummary, finalScore, setFinalScore, matchDuration, setMatchDuration, localPlayerReports, setLocalPlayerReports, localPlayerMatchStats, setLocalPlayerMatchStats });
  const { playersOnPitch, benchPlayers, squadPlayers, activeGamePlayers } = usePlayerGrouping({ formation, gamePlayers, localRosterStatuses });

  // Helper functions
  const getPlayerStatus = (playerId) => localRosterStatuses[playerId] || "Not in Squad";
  const hasReport = (playerId) => {
    const report = localPlayerReports[playerId];
    return report && (report.rating_physical || report.rating_technical || report.rating_tactical || report.rating_mental);
  };
  const needsReport = (playerId) => {
    const status = getPlayerStatus(playerId);
    return (status === "Starting Lineup" || status === "Bench") && !hasReport(playerId);
  };
  const updatePlayerStatus = (playerId, newStatus) => setLocalRosterStatuses(prev => ({ ...prev, [playerId]: newStatus }));

  // Compute match stats from goals and reports
  const matchStats = useMemo(() => {
    const scorerMap = new Map();
    const assisterMap = new Map();
    let topRated = null;
    let maxRating = 0;

    (goals || []).forEach((goal) => {
      if (goal.goalCategory === 'OpponentGoal' || goal.isOpponentGoal) return;
      if (goal.scorerId && goal.scorerId._id) {
        const scorerId = goal.scorerId._id;
        const scorerName = goal.scorerId.fullName || goal.scorerId.name || 'Unknown';
        scorerMap.set(scorerId, { name: scorerName, count: (scorerMap.get(scorerId)?.count || 0) + 1 });
      }
      if (goal.assisterId && goal.assisterId._id) {
        const assisterId = goal.assisterId._id;
        const assisterName = goal.assisterId.fullName || goal.assisterId.name || 'Unknown';
        assisterMap.set(assisterId, { name: assisterName, count: (assisterMap.get(assisterId)?.count || 0) + 1 });
      }
    });

    Object.entries(localPlayerReports).forEach(([playerId, report]) => {
      const avgRating = ((report.rating_physical || 0) + (report.rating_technical || 0) + (report.rating_tactical || 0) + (report.rating_mental || 0)) / 4;
      if (avgRating > maxRating) {
        maxRating = avgRating;
        const player = gamePlayers.find(p => p._id === playerId);
        if (player) topRated = { name: player.fullName, rating: avgRating.toFixed(1) };
      }
    });

    return {
      scorers: Array.from(scorerMap.entries()).map(([id, data]) => ({ id, ...data })),
      assists: Array.from(assisterMap.entries()).map(([id, data]) => ({ id, ...data })),
      topRated
    };
  }, [goals, localPlayerReports, gamePlayers]);

  // Dialog & entity state hooks
  const dialogState = useDialogState();
  const { showConfirmation, showConfirmationModal, setShowConfirmationModal, confirmationConfig } = dialogState;
  const { goals, setGoals, substitutions, setSubstitutions, cards, setCards, difficultyAssessment, setDifficultyAssessment, teamStats, timeline, setTimeline, refreshTeamStats } = useEntityLoading({ gameId, game, isDifficultyAssessmentEnabled });

  // Formation & DnD hooks
  useFormationAutoBuild({ positions, gamePlayers, localRosterStatuses, formation, setFormation, manualFormationMode, setManualFormationMode });
  const dndHandlers = useTacticalBoardDragDrop({ positions, formation, setFormation, updatePlayerStatus, setManualFormationMode, showConfirmation, validatePlayerPosition });

  // All handler hooks
  const gameStateHandlers = useGameStateHandlers({
    gameId, game, formation, formationType, gamePlayers, benchPlayers, localRosterStatuses, getPlayerStatus, finalScore, matchDuration, teamSummary,
    localPlayerReports, localPlayerMatchStats, difficultyAssessment, isDifficultyAssessmentEnabled, games, updateGameInCache, refreshData,
    setGame, setIsReadOnly, setIsFinalizingGame, setIsSaving, showConfirmation, setShowConfirmationModal, setPendingAction: dialogState.setPendingAction, toast
  });
  const reportHandlers = useReportHandlers({
    gameId, game, gamePlayers, localPlayerReports, setLocalPlayerReports, localPlayerMatchStats, setLocalPlayerMatchStats, teamStats, teamSummary, setTeamSummary, needsReport, toast,
    selectedPlayer: dialogState.selectedPlayer, setSelectedPlayer: dialogState.setSelectedPlayer, playerPerfData: dialogState.playerPerfData,
    setPlayerPerfData: dialogState.setPlayerPerfData, setShowPlayerPerfDialog: dialogState.setShowPlayerPerfDialog,
    setSelectedSummaryType: dialogState.setSelectedSummaryType, setShowTeamSummaryDialog: dialogState.setShowTeamSummaryDialog
  });
  const goalsHandlers = useGoalsHandlers({
    gameId, goals, setGoals, finalScore, setFinalScore, setTimeline, refreshTeamStats,
    selectedGoal: dialogState.selectedGoal, setSelectedGoal: dialogState.setSelectedGoal, setShowGoalDialog: dialogState.setShowGoalDialog
  });
  const subsHandlers = useSubstitutionsHandlers({
    gameId, substitutions, setSubstitutions, setTimeline, refreshTeamStats,
    selectedSubstitution: dialogState.selectedSubstitution, setSelectedSubstitution: dialogState.setSelectedSubstitution, setShowSubstitutionDialog: dialogState.setShowSubstitutionDialog
  });
  const cardsHandlers = useCardsHandlers({
    gameId, cards, setCards, setTimeline, refreshTeamStats,
    selectedCard: dialogState.selectedCard, setSelectedCard: dialogState.setSelectedCard, setShowCardDialog: dialogState.setShowCardDialog
  });
  const formationHandlers = useFormationHandlers({
    formation, setFormation, formationType, setFormationType, setManualFormationMode, updatePlayerStatus,
    selectedPosition: dialogState.selectedPosition, setSelectedPosition: dialogState.setSelectedPosition,
    setSelectedPositionData: dialogState.setSelectedPositionData, setShowPlayerSelectionDialog: dialogState.setShowPlayerSelectionDialog
  });
  const difficultyHandlers = useDifficultyHandlers({ gameId, setDifficultyAssessment, toast });

  // Early returns
  if (isLoading || !gameId) return <PageLoader message="Loading game details..." />;
  if (error) return <div className="p-8 text-red-500">Error: {error.message}</div>;
  if (!game) return <div className="p-8 text-gray-400">Game not found</div>;

  // Render: Module composition
  // Computed status flags for readability
  const isScheduled = game?.status === "Scheduled";
  const isPlayed = game?.status === "Played";
  const isDone = game?.status === "Done";

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Blocking Modal for Game Finalization */}
      {isFinalizingGame && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-slate-800 rounded-2xl p-8 max-w-md mx-4 text-center border border-cyan-500/30 shadow-2xl">
            <div className="w-16 h-16 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h2 className="text-2xl font-bold text-white mb-2">Finalizing Game</h2>
            <p className="text-slate-300 mb-4">Please do not navigate away...</p>
          </div>
        </div>
      )}
      
      <GameHeaderModule
        game={game}
        finalScore={finalScore}
        setFinalScore={setFinalScore}
        matchDuration={matchDuration}
        setMatchDuration={setMatchDuration}
        teamSummary={teamSummary}
        missingReportsCount={0}
        playerReports={localPlayerReports}
        matchStats={matchStats}
        isSaving={isSaving}
        isScheduled={isScheduled}
        isPlayed={isPlayed}
        isDone={isDone}
        handleGameWasPlayed={gameStateHandlers.handleGameWasPlayed}
        handlePostpone={gameStateHandlers.handlePostpone}
        handleSubmitFinalReport={gameStateHandlers.handleSubmitFinalReport}
        handleEditReport={gameStateHandlers.handleEditReport}
      />
      
      <RosterSidebarModule
        playersOnPitch={playersOnPitch}
        benchPlayers={benchPlayers}
        squadPlayers={squadPlayers}
        hasReport={hasReport}
        needsReport={needsReport}
        getPlayerStatus={getPlayerStatus}
        handleOpenPerformanceDialog={reportHandlers.handleOpenPerformanceDialog}
        updatePlayerStatus={updatePlayerStatus}
        handleDragStart={dndHandlers.handleDragStart}
        handleDragEnd={dndHandlers.handleDragEnd}
        isScheduled={isScheduled}
        isPlayed={isPlayed}
        isDone={isDone}
      />
      
      <TacticalBoardModule
        tacticalBoardProps={{
          formations,
          formationType,
          positions,
          formation,
          onFormationChange: formationHandlers.handleFormationChange,
          onPositionDrop: dndHandlers.handlePositionDrop,
          onRemovePlayer: dndHandlers.handleRemovePlayerFromPosition,
          onPlayerClick: reportHandlers.handleOpenPerformanceDialog,
          onPositionClick: formationHandlers.handlePositionClick,
          isDragging: dndHandlers.isDragging,
          isScheduled,
          isPlayed,
          isReadOnly: isDone,
          isDone,
          hasReport,
          needsReport,
        }}
        autoFillProps={{
          showAutoFill: isPlayed,
          remainingCount: 0,
          onAutoFill: reportHandlers.handleAutoFillRemaining,
          disabled: isDone,
        }}
      />
      
      <MatchAnalysisModule
        isScheduled={isScheduled}
        isPlayed={isPlayed}
        isDone={isDone}
        teamSummary={teamSummary}
        setTeamSummary={setTeamSummary}
        onTeamSummaryClick={reportHandlers.handleTeamSummaryClick}
        goals={goals}
        onAddGoal={goalsHandlers.handleAddGoal}
        onEditGoal={goalsHandlers.handleEditGoal}
        onDeleteGoal={goalsHandlers.handleDeleteGoal}
        substitutions={substitutions}
        onAddSubstitution={subsHandlers.handleAddSubstitution}
        onEditSubstitution={subsHandlers.handleEditSubstitution}
        onDeleteSubstitution={subsHandlers.handleDeleteSubstitution}
        cards={cards}
        onAddCard={cardsHandlers.handleAddCard}
        onEditCard={cardsHandlers.handleEditCard}
        onDeleteCard={cardsHandlers.handleDeleteCard}
      />
      
      <DialogsModule
        dialogs={{
          goal: {
            isOpen: dialogState.showGoalDialog,
            selected: dialogState.selectedGoal,
            onSave: goalsHandlers.handleSaveGoal,
            onSaveOpponent: goalsHandlers.handleSaveOpponentGoal,
            onClose: () => { dialogState.setShowGoalDialog(false); dialogState.setSelectedGoal(null); },
          },
          substitution: {
            isOpen: dialogState.showSubstitutionDialog,
            selected: dialogState.selectedSubstitution,
            onSave: subsHandlers.handleSaveSubstitution,
            onClose: () => { dialogState.setShowSubstitutionDialog(false); dialogState.setSelectedSubstitution(null); },
          },
          card: {
            isOpen: dialogState.showCardDialog,
            selected: dialogState.selectedCard,
            onSave: cardsHandlers.handleSaveCard,
            onClose: () => { dialogState.setShowCardDialog(false); dialogState.setSelectedCard(null); },
          },
          playerPerf: {
            isOpen: dialogState.showPlayerPerfDialog,
            selectedPlayer: dialogState.selectedPlayer,
            playerPerfData: dialogState.playerPerfData,
            setPlayerPerfData: dialogState.setPlayerPerfData,
            onSave: reportHandlers.handleSavePerformanceReport,
            onClose: () => dialogState.setShowPlayerPerfDialog(false),
          },
          teamSummary: {
            isOpen: dialogState.showTeamSummaryDialog,
            selectedType: dialogState.selectedSummaryType,
            teamSummary,
            onSave: reportHandlers.handleTeamSummarySave,
            onClose: () => dialogState.setShowTeamSummaryDialog(false),
          },
          playerSelection: {
            isOpen: dialogState.showPlayerSelectionDialog,
            selectedPosition: dialogState.selectedPosition,
            selectedPositionData: dialogState.selectedPositionData,
            squadPlayers,
            onSelect: formationHandlers.handleSelectPlayerForPosition,
            onClose: () => {
              dialogState.setShowPlayerSelectionDialog(false);
              dialogState.setSelectedPosition(null);
              dialogState.setSelectedPositionData(null);
            },
          },
          finalReport: {
            isOpen: gameStateHandlers.showFinalReportDialog,
            finalScore,
            teamSummary,
            onConfirm: gameStateHandlers.handleConfirmFinalSubmission,
            onClose: () => gameStateHandlers.setShowFinalReportDialog(false),
          },
        }}
        activeGamePlayers={activeGamePlayers}
      />
      
      <ConfirmationModal
        isOpen={showConfirmationModal}
        onClose={() => setShowConfirmationModal(false)}
        onConfirm={confirmationConfig.onConfirm}
        onCancel={confirmationConfig.onCancel}
        title={confirmationConfig.title}
        message={confirmationConfig.message}
        confirmText={confirmationConfig.confirmText}
        cancelText={confirmationConfig.cancelText}
        type={confirmationConfig.type}
      />
    </div>
  );
}

