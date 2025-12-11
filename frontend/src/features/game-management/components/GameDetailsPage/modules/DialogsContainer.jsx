import React from 'react';

import PlayerPerformanceDialog from '../components/dialogs/PlayerPerformanceDialog';
import FinalReportDialog from '../components/dialogs/FinalReportDialog';
import PlayerSelectionDialog from '../components/dialogs/PlayerSelectionDialog';
import TeamSummaryDialog from '../components/dialogs/TeamSummaryDialog';
import GoalDialog from '../components/dialogs/GoalDialog';
import SubstitutionDialog from '../components/dialogs/SubstitutionDialog';
import CardDialog from '../components/dialogs/CardDialog';

/**
 * DialogsContainer - Renders all game-related dialogs
 * Uses bundled props to avoid prop drilling
 */
export function DialogsContainer({
  dialogs,
  gameCore,
  roster,
  formation,
  events,
  reports,
  teamSummary,
  derivedState,
  handlers,
  isSaving,
}) {
  // Destructure dialog states
  const {
    showPlayerPerfDialog,
    closePlayerPerfDialog,
    selectedPlayer,
    playerPerfData,
    setPlayerPerfData,
    showFinalReportDialog,
    closeFinalReportDialog,
    showPlayerSelectionDialog,
    closePlayerSelectionDialog,
    selectedPosition,
    selectedPositionData,
    showTeamSummaryDialog,
    setShowTeamSummaryDialog,
    selectedSummaryType,
    showGoalDialog,
    closeGoalDialog,
    selectedGoal,
    showSubstitutionDialog,
    closeSubstitutionDialog,
    selectedSubstitution,
    showCardDialog,
    closeCardDialog,
    selectedCard,
    openSubstitutionDialog,
  } = dialogs;

  // Destructure other needed data
  const { game, gamePlayers, matchDuration, isDone } = gameCore;
  const { localRosterStatuses } = roster;
  const { goals, substitutions, cards, timeline } = events;
  const { localPlayerReports, teamStats, isLoadingTeamStats } = reports;
  const { playersOnPitch, benchPlayers, squadPlayers } = derivedState;
  const {
    handleSavePerformanceReport,
    handleConfirmFinalSubmission: handleFinalizeDoneGame,
    handleSelectPlayerForPosition,
  } = handlers;
  const { getCurrentSummaryValue, handleTeamSummarySave } = teamSummary;
  return (
    <>
      {/* Player Performance Dialog */}
      <PlayerPerformanceDialog
        open={showPlayerPerfDialog}
        onOpenChange={closePlayerPerfDialog}
        player={selectedPlayer}
        data={playerPerfData}
        onDataChange={setPlayerPerfData}
        onSave={handleSavePerformanceReport}
        isReadOnly={isDone}
        isStarting={!!(selectedPlayer && playersOnPitch.some(p => p._id === selectedPlayer?._id))}
        game={game}
        matchDuration={matchDuration}
        substitutions={substitutions}
        playerReports={localPlayerReports}
        goals={goals}
        cards={cards}
        timeline={timeline}
        initialMinutes={teamStats[selectedPlayer?._id]?.minutes}
        initialGoals={teamStats[selectedPlayer?._id]?.goals}
        initialAssists={teamStats[selectedPlayer?._id]?.assists}
        isLoadingStats={isLoadingTeamStats}
        onAddSubstitution={() => {
          closePlayerPerfDialog();
          openSubstitutionDialog();
        }}
      />

      {/* Final Report Dialog */}
      <FinalReportDialog
        open={showFinalReportDialog}
        onClose={closeFinalReportDialog}
        onFinalize={handleFinalizeDoneGame}
      />

      {/* Player Selection Dialog */}
      <PlayerSelectionDialog
        open={showPlayerSelectionDialog}
        onClose={closePlayerSelectionDialog}
        position={selectedPosition}
        positionData={selectedPositionData}
        availablePlayers={squadPlayers}
        onSelectPlayer={handleSelectPlayerForPosition}
      />

      {/* Team Summary Dialog */}
      <TeamSummaryDialog
        open={showTeamSummaryDialog}
        onOpenChange={setShowTeamSummaryDialog}
        summaryType={selectedSummaryType}
        currentValue={getCurrentSummaryValue()}
        onSave={handleTeamSummarySave}
        isSaving={isSaving}
      />

      {/* Goal Dialog */}
      <GoalDialog
        isOpen={showGoalDialog}
        onClose={closeGoalDialog}
        onSave={handleSaveGoal}
        onSaveOpponentGoal={handleSaveGoal}
        goal={selectedGoal}
        gamePlayers={gamePlayers}
        existingGoals={goals}
        matchDuration={matchDuration}
        isReadOnly={isDone}
        game={game}
        timeline={timeline}
        startingLineup={Object.fromEntries(
          playersOnPitch.map(p => [p._id, true])
        )}
        squadPlayers={localRosterStatuses}
      />

      {/* Substitution Dialog */}
      <SubstitutionDialog
        isOpen={showSubstitutionDialog}
        onClose={closeSubstitutionDialog}
        onSave={handleSaveSubstitution}
        substitution={selectedSubstitution}
        playersOnPitch={playersOnPitch}
        benchPlayers={benchPlayers}
        matchDuration={matchDuration}
        isReadOnly={isDone}
        playerReports={localPlayerReports}
        timeline={timeline}
        startingLineup={Object.fromEntries(
          playersOnPitch.map(p => [p._id, true])
        )}
        squadPlayers={localRosterStatuses}
      />

      {/* Card Dialog */}
      <CardDialog
        isOpen={showCardDialog}
        onClose={closeCardDialog}
        onSave={handleSaveCard}
        card={selectedCard}
        gamePlayers={gamePlayers}
        cards={cards}
        matchDuration={matchDuration}
        isReadOnly={isDone}
        game={game}
      />
    </>
  );
}
