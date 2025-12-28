import { useState } from 'react';

/**
 * useDialogState
 * 
 * Centralized dialog state management for GameDetailsPage
 * Manages all dialog visibility states and selected entities
 * 
 * @returns {Object} Dialog states and setters
 */
export function useDialogState() {
  // Goal Dialog
  const [showGoalDialog, setShowGoalDialog] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);

  // Substitution Dialog
  const [showSubstitutionDialog, setShowSubstitutionDialog] = useState(false);
  const [selectedSubstitution, setSelectedSubstitution] = useState(null);

  // Card Dialog
  const [showCardDialog, setShowCardDialog] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);

  // Player Performance Dialog
  const [showPlayerPerfDialog, setShowPlayerPerfDialog] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [playerPerfData, setPlayerPerfData] = useState({});

  // Team Summary Dialog
  const [showTeamSummaryDialog, setShowTeamSummaryDialog] = useState(false);
  const [selectedSummaryType, setSelectedSummaryType] = useState(null);

  // Player Selection Dialog (for formation position assignment)
  const [showPlayerSelectionDialog, setShowPlayerSelectionDialog] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [selectedPositionData, setSelectedPositionData] = useState(null);

  // Confirmation Modal
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [confirmationConfig, setConfirmationConfig] = useState({});
  const [pendingAction, setPendingAction] = useState(null);

  const showConfirmation = (config) => {
    setConfirmationConfig(config);
    setShowConfirmationModal(true);
  };

  return {
    // Goal Dialog
    showGoalDialog,
    setShowGoalDialog,
    selectedGoal,
    setSelectedGoal,
    // Substitution Dialog
    showSubstitutionDialog,
    setShowSubstitutionDialog,
    selectedSubstitution,
    setSelectedSubstitution,
    // Card Dialog
    showCardDialog,
    setShowCardDialog,
    selectedCard,
    setSelectedCard,
    // Player Performance Dialog
    showPlayerPerfDialog,
    setShowPlayerPerfDialog,
    selectedPlayer,
    setSelectedPlayer,
    playerPerfData,
    setPlayerPerfData,
    // Team Summary Dialog
    showTeamSummaryDialog,
    setShowTeamSummaryDialog,
    selectedSummaryType,
    setSelectedSummaryType,
    // Player Selection Dialog
    showPlayerSelectionDialog,
    setShowPlayerSelectionDialog,
    selectedPosition,
    setSelectedPosition,
    selectedPositionData,
    setSelectedPositionData,
    // Confirmation Modal
    showConfirmationModal,
    setShowConfirmationModal,
    confirmationConfig,
    pendingAction,
    setPendingAction,
    showConfirmation,
  };
}

