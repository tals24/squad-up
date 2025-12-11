import { useState, useEffect } from 'react';

/**
 * Custom hook to manage all dialog states in GameDetailsPage
 * Consolidates 7 dialogs with their open/close states and selected items
 */
export function useDialogManagement(game) {
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

  // Final Report Dialog
  const [showFinalReportDialog, setShowFinalReportDialog] = useState(false);

  // Player Selection Dialog (for formation)
  const [showPlayerSelectionDialog, setShowPlayerSelectionDialog] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [selectedPositionData, setSelectedPositionData] = useState(null);

  // Read-only mode
  const [isReadOnly, setIsReadOnly] = useState(false);

  // Update read-only state when game status changes
  useEffect(() => {
    if (game) {
      setIsReadOnly(game.status === "Done");
    }
  }, [game]);

  // Helper functions to open dialogs
  const openGoalDialog = (goal = null) => {
    setSelectedGoal(goal);
    setShowGoalDialog(true);
  };

  const openSubstitutionDialog = (substitution = null) => {
    setSelectedSubstitution(substitution);
    setShowSubstitutionDialog(true);
  };

  const openCardDialog = (card = null) => {
    setSelectedCard(card);
    setShowCardDialog(true);
  };

  const openPlayerPerfDialog = (player, perfData = {}) => {
    setSelectedPlayer(player);
    setPlayerPerfData(perfData);
    setShowPlayerPerfDialog(true);
  };

  const openFinalReportDialog = () => {
    setShowFinalReportDialog(true);
  };

  const openPlayerSelectionDialog = (position, positionData) => {
    setSelectedPosition(position);
    setSelectedPositionData(positionData);
    setShowPlayerSelectionDialog(true);
  };

  // Helper functions to close dialogs
  const closeGoalDialog = () => {
    setShowGoalDialog(false);
    setSelectedGoal(null);
  };

  const closeSubstitutionDialog = () => {
    setShowSubstitutionDialog(false);
    setSelectedSubstitution(null);
  };

  const closeCardDialog = () => {
    setShowCardDialog(false);
    setSelectedCard(null);
  };

  const closePlayerPerfDialog = () => {
    setShowPlayerPerfDialog(false);
    setSelectedPlayer(null);
    setPlayerPerfData({});
  };

  const closeFinalReportDialog = () => {
    setShowFinalReportDialog(false);
  };

  const closePlayerSelectionDialog = () => {
    setShowPlayerSelectionDialog(false);
    setSelectedPosition(null);
    setSelectedPositionData(null);
  };

  return {
    // Goal dialog
    showGoalDialog,
    setShowGoalDialog,
    selectedGoal,
    setSelectedGoal,
    openGoalDialog,
    closeGoalDialog,

    // Substitution dialog
    showSubstitutionDialog,
    setShowSubstitutionDialog,
    selectedSubstitution,
    setSelectedSubstitution,
    openSubstitutionDialog,
    closeSubstitutionDialog,

    // Card dialog
    showCardDialog,
    setShowCardDialog,
    selectedCard,
    setSelectedCard,
    openCardDialog,
    closeCardDialog,

    // Player performance dialog
    showPlayerPerfDialog,
    setShowPlayerPerfDialog,
    selectedPlayer,
    setSelectedPlayer,
    playerPerfData,
    setPlayerPerfData,
    openPlayerPerfDialog,
    closePlayerPerfDialog,

    // Final report dialog
    showFinalReportDialog,
    setShowFinalReportDialog,
    openFinalReportDialog,
    closeFinalReportDialog,

    // Player selection dialog
    showPlayerSelectionDialog,
    setShowPlayerSelectionDialog,
    selectedPosition,
    setSelectedPosition,
    selectedPositionData,
    setSelectedPositionData,
    openPlayerSelectionDialog,
    closePlayerSelectionDialog,

    // Read-only mode
    isReadOnly,
    setIsReadOnly,
  };
}

