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
  const isDifficultyAssessmentEnabled = useFeature("gameDifficultyAssessmentEnabled");
  console.log('🔍 [GameDetailsPage] isDifficultyAssessmentEnabled:', isDifficultyAssessmentEnabled);

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
  const { playersOnPitch, benchPlayers, squadPlayers, activeGamePlayers, startingLineupMap, squadPlayersMap } = usePlayerGrouping({ formation, gamePlayers, localRosterStatuses });

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

  // Calculate missing reports count for active players (Starting Lineup + Bench)
  const missingReportsCount = useMemo(() => {
    if (!gamePlayers || gamePlayers.length === 0) return 0;
    return gamePlayers.filter(player => {
      const status = getPlayerStatus(player._id);
      return (status === "Starting Lineup" || status === "Bench") && !hasReport(player._id);
    }).length;
  }, [gamePlayers, localRosterStatuses, localPlayerReports]);

  // Dialog & entity state hooks
  const dialogState = useDialogState();
  const { showConfirmation, showConfirmationModal, setShowConfirmationModal, confirmationConfig } = dialogState;
  const { goals, setGoals, substitutions, setSubstitutions, cards, setCards, difficultyAssessment, setDifficultyAssessment, teamStats, timeline, setTimeline, refreshTeamStats } = useEntityLoading({ gameId, game, isDifficultyAssessmentEnabled });

  // Compute match stats from goals and reports (AFTER goals is defined)
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

  // Formation & DnD hooks
  useFormationAutoBuild({ positions, gamePlayers, localRosterStatuses, formation, setFormation, manualFormationMode, setManualFormationMode });
  const dndHandlers = useTacticalBoardDragDrop({ positions, formation, setFormation, updatePlayerStatus, setManualFormationMode, showConfirmation, validatePlayerPosition });

  // All handler hooks
  const gameStateHandlers = useGameStateHandlers({
    gameId, game, formation, formationType, gamePlayers, benchPlayers, localRosterStatuses, getPlayerStatus, finalScore, matchDuration, teamSummary,
    localPlayerReports, localPlayerMatchStats, difficultyAssessment, isDifficultyAssessmentEnabled, games, updateGameInCache, updateGameRostersInCache, refreshData,
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
    gameId, substitutions, setSubstitutions, setTimeline, refreshTeamStats, goals,
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
    <div className="flex flex-col h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
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
      
      {/* Header - Full Width */}
      <GameHeaderModule
        game={game}
        finalScore={finalScore}
        setFinalScore={setFinalScore}
        matchDuration={matchDuration}
        setMatchDuration={setMatchDuration}
        teamSummary={teamSummary}
        missingReportsCount={missingReportsCount}
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
      
      {/* Main Content - 3 Column Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Game Day Roster */}
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
        
        {/* Center - Tactical Board */}
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
            remainingCount: missingReportsCount,
            onAutoFill: reportHandlers.handleAutoFillRemaining,
            disabled: isDone,
          }}
        />
        
        {/* Right Sidebar - Match Analysis */}
        <MatchAnalysisModule
          isScheduled={isScheduled}
          isPlayed={isPlayed}
          isDone={isDone}
          game={game}
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
          matchDuration={matchDuration}
          setMatchDuration={setMatchDuration}
          difficultyAssessment={difficultyAssessment}
          onSaveDifficultyAssessment={difficultyHandlers.handleSaveDifficultyAssessment}
          onDeleteDifficultyAssessment={difficultyHandlers.handleDeleteDifficultyAssessment}
          isDifficultyAssessmentEnabled={isDifficultyAssessmentEnabled}
        />
      </div>
      
      <DialogsModule
        dialogs={{
          goal: {
            isOpen: dialogState.showGoalDialog,
            goal: dialogState.selectedGoal,
            gamePlayers: activeGamePlayers,
            existingGoals: goals,
            matchDuration: matchDuration?.minutes || 90,
            isReadOnly: isDone,
            game,
            timeline,
            startingLineup: startingLineupMap,
            squadPlayers: squadPlayersMap,
            onSave: goalsHandlers.handleSaveGoal,
            onSaveOpponent: goalsHandlers.handleSaveOpponentGoal,
            onClose: () => { dialogState.setShowGoalDialog(false); dialogState.setSelectedGoal(null); },
          },
          substitution: {
            isOpen: dialogState.showSubstitutionDialog,
            substitution: dialogState.selectedSubstitution,
            playersOnPitch,
            benchPlayers,
            matchDuration: matchDuration?.minutes || 90,
            isReadOnly: isDone,
            playerReports: localPlayerReports,
            timeline,
            startingLineup: startingLineupMap,
            squadPlayers: squadPlayersMap,
            onSave: subsHandlers.handleSaveSubstitution,
            onClose: () => { dialogState.setShowSubstitutionDialog(false); dialogState.setSelectedSubstitution(null); },
          },
          card: {
            isOpen: dialogState.showCardDialog,
            card: dialogState.selectedCard,
            gamePlayers: activeGamePlayers,
            cards,
            matchDuration: matchDuration?.minutes || 90,
            isReadOnly: isDone,
            game,
            onSave: cardsHandlers.handleSaveCard,
            onClose: () => { dialogState.setShowCardDialog(false); dialogState.setSelectedCard(null); },
          },
          playerPerformance: {
            open: dialogState.showPlayerPerfDialog,
            onOpenChange: dialogState.setShowPlayerPerfDialog,
            player: dialogState.selectedPlayer,
            data: dialogState.playerPerfData,
            onDataChange: dialogState.setPlayerPerfData,
            isReadOnly: isDone,
            isStarting: dialogState.selectedPlayer ? getPlayerStatus(dialogState.selectedPlayer._id) === "Starting Lineup" : false,
            game,
            matchDuration: matchDuration?.minutes || 90,
            substitutions,
            playerReports: localPlayerReports,
            onAddSubstitution: () => { /* TODO: handle add substitution from player dialog */ },
            goals,
            timeline,
            cards,
            // Add calculated stats for read-only display (API returns 'minutes', not 'minutesPlayed')
            initialMinutes: dialogState.selectedPlayer && (teamStats[dialogState.selectedPlayer._id]?.minutes || teamStats[dialogState.selectedPlayer._id]?.minutesPlayed || 0),
            initialGoals: dialogState.selectedPlayer && (teamStats[dialogState.selectedPlayer._id]?.goals || 0),
            initialAssists: dialogState.selectedPlayer && (teamStats[dialogState.selectedPlayer._id]?.assists || 0),
            onSave: reportHandlers.handleSavePerformanceReport,
            onClose: () => dialogState.setShowPlayerPerfDialog(false),
          },
          teamSummary: {
            open: dialogState.showTeamSummaryDialog,
            onOpenChange: dialogState.setShowTeamSummaryDialog,
            summaryType: dialogState.selectedSummaryType,
            currentValue: teamSummary[`${dialogState.selectedSummaryType}Summary`] || "",
            onSave: reportHandlers.handleTeamSummarySave,
          },
          playerSelection: {
            open: dialogState.showPlayerSelectionDialog,
            position: dialogState.selectedPosition,
            positionData: dialogState.selectedPositionData,
            availablePlayers: squadPlayers,
            onSelectPlayer: formationHandlers.handleSelectPlayerForPosition,
            onClose: () => {
              dialogState.setShowPlayerSelectionDialog(false);
              dialogState.setSelectedPosition(null);
              dialogState.setSelectedPositionData(null);
            },
          },
          finalReport: {
            open: gameStateHandlers.showFinalReportDialog,
            onOpenChange: gameStateHandlers.setShowFinalReportDialog,
            finalScore,
            teamSummary,
            onConfirm: gameStateHandlers.handleConfirmFinalSubmission,
            isSaving: isSaving,
          },
          confirmation: {
            isOpen: showConfirmationModal,
            onClose: () => setShowConfirmationModal(false),
            onConfirm: confirmationConfig.onConfirm,
            onCancel: confirmationConfig.onCancel,
            title: confirmationConfig.title,
            message: confirmationConfig.message,
            confirmText: confirmationConfig.confirmText,
            cancelText: confirmationConfig.cancelText,
            type: confirmationConfig.type,
          },
        }}
      />
    </div>
  );
}

