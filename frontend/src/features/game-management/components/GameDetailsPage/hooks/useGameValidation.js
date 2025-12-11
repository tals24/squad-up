import { useState, useCallback } from 'react';

import {
  validateSquad,
  validateStartingLineup,
  validateGoalkeeper,
} from '../../../utils/squadValidation';

/**
 * Game validation hook
 * Handles squad validation and confirmation modals
 * @param {object} formation - Current formation
 * @param {Array} benchPlayers - Players on the bench
 * @param {object} teamSummary - Team summary data
 * @param {object} localRosterStatuses - Current roster statuses
 */
export function useGameValidation(formation, benchPlayers, teamSummary, localRosterStatuses) {
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [confirmationConfig, setConfirmationConfig] = useState({
    title: "",
    message: "",
    confirmText: "Confirm",
    cancelText: "Cancel",
    onConfirm: null,
    onCancel: null,
    type: "warning"
  });

  // Show confirmation modal
  const showConfirmation = useCallback((config) => {
    setConfirmationConfig(config);
    setShowConfirmationModal(true);
  }, []);

  // Handle confirmation
  const handleConfirmation = useCallback(() => {
    if (confirmationConfig.onConfirm) {
      confirmationConfig.onConfirm();
    }
    setShowConfirmationModal(false);
  }, [confirmationConfig]);

  // Handle confirmation cancel
  const handleConfirmationCancel = useCallback(() => {
    if (confirmationConfig.onCancel) {
      confirmationConfig.onCancel();
    }
    setShowConfirmationModal(false);
  }, [confirmationConfig]);

  // Validate squad for "Game Was Played" transition
  const validateSquadForPlayed = useCallback(() => {
    const squadValidation = validateSquad(formation, benchPlayers, localRosterStatuses);
    
    // Check if starting lineup is valid (mandatory 11 players)
    if (!squadValidation.startingLineup.isValid) {
      return {
        isValid: false,
        needsConfirmation: false,
        error: squadValidation.startingLineup.message,
      };
    }
    
    // Check if goalkeeper is assigned
    if (!squadValidation.goalkeeper.hasGoalkeeper) {
      return {
        isValid: false,
        needsConfirmation: false,
        error: squadValidation.goalkeeper.message,
      };
    }
    
    // Check bench size (may need confirmation)
    if (squadValidation.needsConfirmation) {
      return {
        isValid: true,
        needsConfirmation: true,
        confirmationMessage: squadValidation.bench.confirmationMessage,
      };
    }
    
    return {
      isValid: true,
      needsConfirmation: false,
    };
  }, [formation, benchPlayers, localRosterStatuses]);

  // Check if all team summaries are filled
  const areAllTeamSummariesFilled = useCallback(() => {
    return (
      teamSummary.defenseSummary && teamSummary.defenseSummary.trim() &&
      teamSummary.midfieldSummary && teamSummary.midfieldSummary.trim() &&
      teamSummary.attackSummary && teamSummary.attackSummary.trim() &&
      teamSummary.generalSummary && teamSummary.generalSummary.trim()
    );
  }, [teamSummary]);

  // Comprehensive validation for "Played" status (final report submission)
  const validatePlayedStatus = useCallback(() => {
    const validations = [];
    let hasErrors = false;

    // 1. Basic squad validation (no bench validation for "Played" status)
    const startingLineupValidation = validateStartingLineup(formation);
    if (!startingLineupValidation.isValid) {
      hasErrors = true;
      validations.push(startingLineupValidation.message);
    }
    
    const goalkeeperValidation = validateGoalkeeper(formation);
    if (!goalkeeperValidation.hasGoalkeeper) {
      hasErrors = true;
      validations.push(goalkeeperValidation.message);
    }

    // 2. Team summaries validation
    if (!areAllTeamSummariesFilled()) {
      hasErrors = true;
      validations.push("All team summary reports must be completed");
    }

    return {
      isValid: !hasErrors,
      hasErrors,
      needsConfirmation: false,
      messages: validations
    };
  }, [formation, areAllTeamSummariesFilled]);

  return {
    showConfirmationModal,
    setShowConfirmationModal,
    confirmationConfig,
    showConfirmation,
    handleConfirmation,
    handleConfirmationCancel,
    validateSquadForPlayed,
    validatePlayedStatus,
    areAllTeamSummariesFilled,
  };
}

