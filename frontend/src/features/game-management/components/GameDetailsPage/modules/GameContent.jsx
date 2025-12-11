import React from 'react';

import GameDayRosterSidebar from '../components/GameDayRosterSidebar';
import TacticalBoard from '../components/TacticalBoard';
import MatchAnalysisSidebar from '../components/MatchAnalysisSidebar';
import AutoFillReportsButton from '../components/AutoFillReportsButton';

/**
 * GameContent - 3-column layout for game details
 * Uses bundled props to avoid prop drilling hell
 */
export function GameContent({
  gameCore,
  roster,
  formation,
  events,
  reports,
  difficulty,
  teamSummary,
  derivedState,
  dragDrop,
  dialogs,
}) {
  // Destructure only what's needed for this component
  const { game, gamePlayers, matchDuration, finalScore, isScheduled, isPlayed, isDone, playerMap } = gameCore;
  const { localRosterStatuses, updatePlayerStatus, isAutosaving } = roster;
  const { 
    formation: formationState, 
    formationType, 
    positions, 
    manualFormationMode, 
    handleFormationChange 
  } = formation;
  const { goals, substitutions, cards, timeline } = events;
  const { 
    localPlayerReports, 
    localPlayerMatchStats, 
    teamStats, 
    hasReport, 
    needsReport, 
    missingReportsCount, 
    remainingReportsCount, 
    handleAutoFillRemaining 
  } = reports;
  const { difficultyAssessment, isDifficultyAssessmentEnabled } = difficulty;
  const { teamSummary: teamSummaryData, handleTeamSummaryClick } = teamSummary;
  const { 
    draggedPlayer, 
    isDragging, 
    handleDragStart, 
    handleDragEnd, 
    handlePositionDrop, 
    handleRemovePlayerFromPosition 
  } = dragDrop;
  const { 
    openPlayerPerfDialog, 
    openGoalDialog, 
    openSubstitutionDialog, 
    openCardDialog, 
    openPlayerSelectionDialog, 
    openFinalReportDialog 
  } = dialogs;
  return (
    <div className="flex flex-1 gap-6 overflow-hidden">
      {/* Left Sidebar - Roster */}
      <GameDayRosterSidebar
        gamePlayers={gamePlayers}
        localRosterStatuses={localRosterStatuses}
        updatePlayerStatus={updatePlayerStatus}
        isScheduled={isScheduled}
        isPlayed={isPlayed}
        isDone={isDone}
        isAutosaving={isAutosaving}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      />

      {/* Center - Tactical Board */}
      <div className="flex-1 flex flex-col gap-4">
        <TacticalBoard
          formation={formationState}
          formationType={formationType}
          positions={positions}
          onFormationChange={handleFormationChange}
          onPositionDrop={handlePositionDrop}
          onPositionClick={openPlayerSelectionDialog}
          onPlayerRemove={handleRemovePlayerFromPosition}
          isScheduled={isScheduled}
          isPlayed={isPlayed}
          isDone={isDone}
          manualFormationMode={manualFormationMode}
          draggedPlayer={draggedPlayer}
          isDragging={isDragging}
        />
      </div>

      {/* Right Sidebar - Match Analysis */}
      <MatchAnalysisSidebar
        game={game}
        isScheduled={isScheduled}
        isPlayed={isPlayed}
        isDone={isDone}
        matchDuration={matchDuration}
        finalScore={finalScore}
        goals={goals}
        substitutions={substitutions}
        cards={cards}
        timeline={timeline}
        localPlayerReports={localPlayerReports}
        localPlayerMatchStats={localPlayerMatchStats}
        teamStats={teamStats}
        gamePlayers={gamePlayers}
        playersOnPitch={Object.values(formationState).filter(p => p !== null)}
        hasReport={hasReport}
        needsReport={needsReport}
        missingReportsCount={missingReportsCount}
        remainingReportsCount={remainingReportsCount}
        difficultyAssessment={difficultyAssessment}
        isDifficultyAssessmentEnabled={isDifficultyAssessmentEnabled}
        teamSummary={teamSummaryData}
        playerMap={playerMap}
        onEditPlayerReport={openPlayerPerfDialog}
        onAddGoal={openGoalDialog}
        onEditGoal={openGoalDialog}
        onDeleteGoal={(goal) => console.log('Delete goal', goal)}
        onAddSubstitution={openSubstitutionDialog}
        onEditSubstitution={openSubstitutionDialog}
        onDeleteSubstitution={(sub) => console.log('Delete sub', sub)}
        onAddCard={openCardDialog}
        onEditCard={openCardDialog}
        onDeleteCard={(card) => console.log('Delete card', card)}
        onEditDifficulty={() => console.log('Edit difficulty')}
        onTeamSummaryClick={handleTeamSummaryClick}
        onViewFinalReport={openFinalReportDialog}
        renderAutoFillButton={() => (
          <AutoFillReportsButton
            missingReportsCount={missingReportsCount}
            remainingReportsCount={remainingReportsCount}
            onAutoFill={handleAutoFillRemaining}
            isDisabled={remainingReportsCount === 0}
          />
        )}
      />
    </div>
  );
}

