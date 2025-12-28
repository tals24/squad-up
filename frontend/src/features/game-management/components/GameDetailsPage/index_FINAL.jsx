import React, { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useData } from "@/app/providers/DataProvider";
import { useToast } from "@/shared/ui/primitives/use-toast";
import { useFeature } from "@/shared/hooks";
import { formations } from "./formations";
import { ConfirmationModal } from "@/shared/components";
import PageLoader from "@/shared/components/PageLoader";
import { validatePlayerPosition } from "../../utils/squadValidation";
import { GameHeaderModule, RosterSidebarModule, TacticalBoardModule, MatchAnalysisModule, DialogsModule } from "./modules";
import {
  useGameDetailsData, useLineupDraftManager, useReportDraftManager, usePlayerGrouping, useFormationAutoBuild,
  useTacticalBoardDragDrop, useGameStateHandlers, useReportHandlers, useGoalsHandlers, useSubstitutionsHandlers,
  useCardsHandlers, useFormationHandlers, useDifficultyHandlers, useDialogState, useEntityLoading,
} from "./hooks";

export default function GameDetails() {
  const [searchParams] = useSearchParams();
  const gameId = searchParams.get("id");
  const { games, players, teams, gameRosters, gameReports, refreshData, isLoading, error, updateGameInCache, updateGameRostersInCache } = useData();
  const { toast } = useToast();
  const isDifficultyAssessmentEnabled = useFeature("difficultyAssessment");
  const [formationType, setFormationType] = useState("1-4-4-2");
  const [formation, setFormation] = useState({});
  const [manualFormationMode, setManualFormationMode] = useState(false);
  const positions = useMemo(() => formations[formationType]?.positions || {}, [formationType]);
  const [isFinalizingGame, setIsFinalizingGame] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const { game, gamePlayers, isFetchingGame, matchDuration, finalScore, teamSummary, isReadOnly, setGame, setMatchDuration, setFinalScore, setTeamSummary, setIsReadOnly } = useGameDetailsData(gameId, { games, players, teams });
  const { localRosterStatuses, setLocalRosterStatuses, isAutosaving, autosaveError } = useLineupDraftManager({ gameId, game, gamePlayers, gameRosters, isFinalizingGame, formation, setFormation, formationType, setFormationType, manualFormationMode, setManualFormationMode });
  const [localPlayerReports, setLocalPlayerReports] = useState({});
  const [localPlayerMatchStats, setLocalPlayerMatchStats] = useState({});
  const { isAutosavingReport, reportAutosaveError } = useReportDraftManager({ gameId, game, isFinalizingGame, teamSummary, setTeamSummary, finalScore, setFinalScore, matchDuration, setMatchDuration, localPlayerReports, setLocalPlayerReports, localPlayerMatchStats, setLocalPlayerMatchStats });
  const { playersOnPitch, benchPlayers, squadPlayers, activeGamePlayers, startingLineupMap, squadPlayersMap } = usePlayerGrouping({ formation, gamePlayers, localRosterStatuses });
  
  const getPlayerStatus = (playerId) => localRosterStatuses[playerId] || "Not in Squad";
  const hasReport = (playerId) => { const report = localPlayerReports[playerId]; return report && (report.rating_physical || report.rating_technical || report.rating_tactical || report.rating_mental); };
  const needsReport = (playerId) => { const status = getPlayerStatus(playerId); return (status === "Starting Lineup" || status === "Bench") && !hasReport(playerId); };
  const updatePlayerStatus = (playerId, newStatus) => setLocalRosterStatuses(prev => ({ ...prev, [playerId]: newStatus }));

  const dialogState = useDialogState();
  const { showConfirmation, showConfirmationModal, setShowConfirmationModal, confirmationConfig } = dialogState;
  const entityLoading = useEntityLoading({ gameId, game, isDifficultyAssessmentEnabled });
  const { goals, setGoals, substitutions, setSubstitutions, cards, setCards, difficultyAssessment, setDifficultyAssessment, teamStats, timeline, setTimeline, localPlayerMatchStats: loadedMatchStats, setLocalPlayerMatchStats, refreshTeamStats } = entityLoading;

  useFormationAutoBuild({ positions, gamePlayers, localRosterStatuses, formation, setFormation, manualFormationMode, setManualFormationMode });
  const dndHandlers = useTacticalBoardDragDrop({ positions, formation, setFormation, updatePlayerStatus, setManualFormationMode, showConfirmation, validatePlayerPosition });

  const gameStateHandlers = useGameStateHandlers({ gameId, game, formation, formationType, gamePlayers, benchPlayers, localRosterStatuses, getPlayerStatus, finalScore, matchDuration, teamSummary, localPlayerReports, localPlayerMatchStats, difficultyAssessment, isDifficultyAssessmentEnabled, games, updateGameInCache, refreshData, setGame, setIsReadOnly, setIsFinalizingGame, setIsSaving, showConfirmation, setShowConfirmationModal, setPendingAction: dialogState.setPendingAction, toast });
  const reportHandlers = useReportHandlers({ gameId, game, gamePlayers, localPlayerReports, setLocalPlayerReports, localPlayerMatchStats, setLocalPlayerMatchStats, selectedPlayer: dialogState.selectedPlayer, setSelectedPlayer: dialogState.setSelectedPlayer, playerPerfData: dialogState.playerPerfData, setPlayerPerfData: dialogState.setPlayerPerfData, setShowPlayerPerfDialog: dialogState.setShowPlayerPerfDialog, setSelectedSummaryType: dialogState.setSelectedSummaryType, setShowTeamSummaryDialog: dialogState.setShowTeamSummaryDialog, teamStats, teamSummary, setTeamSummary, needsReport, toast });
  const goalsHandlers = useGoalsHandlers({ gameId, goals, setGoals, finalScore, setFinalScore, setTimeline, refreshTeamStats, selectedGoal: dialogState.selectedGoal, setSelectedGoal: dialogState.setSelectedGoal, setShowGoalDialog: dialogState.setShowGoalDialog });
  const subsHandlers = useSubstitutionsHandlers({ gameId, substitutions, setSubstitutions, setTimeline, refreshTeamStats, selectedSubstitution: dialogState.selectedSubstitution, setSelectedSubstitution: dialogState.setSelectedSubstitution, setShowSubstitutionDialog: dialogState.setShowSubstitutionDialog });
  const cardsHandlers = useCardsHandlers({ gameId, cards, setCards, setTimeline, refreshTeamStats, selectedCard: dialogState.selectedCard, setSelectedCard: dialogState.setSelectedCard, setShowCardDialog: dialogState.setShowCardDialog });
  const formationHandlers = useFormationHandlers({ formation, setFormation, formationType, setFormationType, setManualFormationMode, updatePlayerStatus, selectedPosition: dialogState.selectedPosition, setSelectedPosition: dialogState.setSelectedPosition, setSelectedPositionData: dialogState.setSelectedPositionData, setShowPlayerSelectionDialog: dialogState.setShowPlayerSelectionDialog });
  const difficultyHandlers = useDifficultyHandlers({ gameId, setDifficultyAssessment, toast });

  if (isLoading || !gameId) return <PageLoader message="Loading game details..." />;
  if (error) return <div className="p-8 text-red-500">Error: {error.message}</div>;
  if (!game) return <div className="p-8 text-gray-400">Game not found</div>;

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <GameHeaderModule gameHeaderProps={{ game, isReadOnly, isSaving, isAutosaving, autosaveError, isAutosavingReport, reportAutosaveError, onGameWasPlayed: gameStateHandlers.handleGameWasPlayed, onPostpone: gameStateHandlers.handlePostpone, onSubmitFinalReport: gameStateHandlers.handleSubmitFinalReport, onEditReport: gameStateHandlers.handleEditReport, difficultyAssessment, onSaveDifficultyAssessment: difficultyHandlers.handleSaveDifficultyAssessment, onDeleteDifficultyAssessment: difficultyHandlers.handleDeleteDifficultyAssessment, isDifficultyAssessmentEnabled }} />
      <RosterSidebarModule rosterProps={{ gamePlayers, squadPlayers, benchPlayers, formation, localRosterStatuses, updatePlayerStatus, isReadOnly, getPlayerStatus, hasReport, needsReport, onOpenPerformanceDialog: reportHandlers.handleOpenPerformanceDialog }} />
      <TacticalBoardModule tacticalBoardProps={{ formations, formationType, positions, formation, onFormationChange: formationHandlers.handleFormationChange, onDragStart: dndHandlers.handleDragStart, onDragEnd: dndHandlers.handleDragEnd, onPositionDrop: dndHandlers.handlePositionDrop, onRemovePlayerFromPosition: dndHandlers.handleRemovePlayerFromPosition, onPositionClick: formationHandlers.handlePositionClick, isDragging: dndHandlers.isDragging, draggedPlayer: dndHandlers.draggedPlayer, isReadOnly, playersOnPitch, benchPlayers }} autoFillButtonProps={{ onClick: reportHandlers.handleAutoFillRemaining, disabled: game.status !== 'Played' }} />
      <MatchAnalysisModule matchAnalysisProps={{ game, isReadOnly, finalScore, setFinalScore, matchDuration, setMatchDuration, teamSummary, onTeamSummaryClick: reportHandlers.handleTeamSummaryClick, timeline, goals, substitutions, cards, onAddGoal: goalsHandlers.handleAddGoal, onEditGoal: goalsHandlers.handleEditGoal, onDeleteGoal: goalsHandlers.handleDeleteGoal, onAddSubstitution: subsHandlers.handleAddSubstitution, onEditSubstitution: subsHandlers.handleEditSubstitution, onDeleteSubstitution: subsHandlers.handleDeleteSubstitution, onAddCard: cardsHandlers.handleAddCard, onEditCard: cardsHandlers.handleEditCard, onDeleteCard: cardsHandlers.handleDeleteCard }} />
      <DialogsModule dialogsProps={{ showGoalDialog: dialogState.showGoalDialog, selectedGoal: dialogState.selectedGoal, activeGamePlayers, onSaveGoal: goalsHandlers.handleSaveGoal, onSaveOpponentGoal: goalsHandlers.handleSaveOpponentGoal, onCloseGoalDialog: () => { dialogState.setShowGoalDialog(false); dialogState.setSelectedGoal(null); }, showSubstitutionDialog: dialogState.showSubstitutionDialog, selectedSubstitution: dialogState.selectedSubstitution, onSaveSubstitution: subsHandlers.handleSaveSubstitution, onCloseSubstitutionDialog: () => { dialogState.setShowSubstitutionDialog(false); dialogState.setSelectedSubstitution(null); }, showCardDialog: dialogState.showCardDialog, selectedCard: dialogState.selectedCard, onSaveCard: cardsHandlers.handleSaveCard, onCloseCardDialog: () => { dialogState.setShowCardDialog(false); dialogState.setSelectedCard(null); }, showPlayerPerfDialog: dialogState.showPlayerPerfDialog, selectedPlayer: dialogState.selectedPlayer, playerPerfData: dialogState.playerPerfData, setPlayerPerfData: dialogState.setPlayerPerfData, onSavePerformanceReport: reportHandlers.handleSavePerformanceReport, onClosePlayerPerfDialog: () => dialogState.setShowPlayerPerfDialog(false), showTeamSummaryDialog: dialogState.showTeamSummaryDialog, selectedSummaryType: dialogState.selectedSummaryType, teamSummary, onSaveTeamSummary: reportHandlers.handleTeamSummarySave, onCloseTeamSummaryDialog: () => dialogState.setShowTeamSummaryDialog(false), showPlayerSelectionDialog: dialogState.showPlayerSelectionDialog, selectedPosition: dialogState.selectedPosition, selectedPositionData: dialogState.selectedPositionData, squadPlayers, onSelectPlayerForPosition: formationHandlers.handleSelectPlayerForPosition, onClosePlayerSelectionDialog: () => { dialogState.setShowPlayerSelectionDialog(false); dialogState.setSelectedPosition(null); dialogState.setSelectedPositionData(null); }, showFinalReportDialog: gameStateHandlers.showFinalReportDialog, onConfirmFinalSubmission: gameStateHandlers.handleConfirmFinalSubmission, onCloseFinalReportDialog: () => gameStateHandlers.setShowFinalReportDialog(false), isFinalizingGame }} />
      <ConfirmationModal isOpen={showConfirmationModal} onClose={() => setShowConfirmationModal(false)} onConfirm={confirmationConfig.onConfirm} onCancel={confirmationConfig.onCancel} title={confirmationConfig.title} message={confirmationConfig.message} confirmText={confirmationConfig.confirmText} cancelText={confirmationConfig.cancelText} type={confirmationConfig.type} />
    </div>
  );
}

