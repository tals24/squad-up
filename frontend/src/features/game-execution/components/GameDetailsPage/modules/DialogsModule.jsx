import React from 'react';
import { ConfirmationModal } from '@/shared/components';
import FinalReportDialog from '../components/dialogs/FinalReportDialog';
import PlayerPerformanceDialog from '../components/dialogs/PlayerPerformanceDialog';
import PlayerSelectionDialog from '../components/dialogs/PlayerSelectionDialog';
import TeamSummaryDialog from '../components/dialogs/TeamSummaryDialog';
import GoalDialog from '../components/dialogs/GoalDialog';
import SubstitutionDialog from '../components/dialogs/SubstitutionDialog';
import CardDialog from '../components/dialogs/CardDialog';

/**
 * DialogsModule
 *
 * Pure wrapper that composes all game details dialogs.
 * No logic - just composition and prop forwarding.
 * Centralizes all dialog rendering in one place.
 *
 * @param {Object} dialogs - Object containing props for each dialog
 */
export default function DialogsModule({ dialogs }) {
  const {
    finalReport,
    playerPerformance,
    playerSelection,
    teamSummary,
    goal,
    substitution,
    card,
    confirmation,
  } = dialogs;

  return (
    <>
      {/* Final Report Dialog */}
      <FinalReportDialog {...finalReport} />

      {/* Player Performance Dialog */}
      <PlayerPerformanceDialog {...playerPerformance} />

      {/* Player Selection Dialog */}
      <PlayerSelectionDialog {...playerSelection} />

      {/* Team Summary Dialog */}
      <TeamSummaryDialog {...teamSummary} />

      {/* Goal Dialog */}
      <GoalDialog {...goal} />

      {/* Substitution Dialog */}
      <SubstitutionDialog {...substitution} />

      {/* Card Dialog */}
      <CardDialog {...card} />

      {/* Confirmation Modal */}
      <ConfirmationModal {...confirmation} />
    </>
  );
}
