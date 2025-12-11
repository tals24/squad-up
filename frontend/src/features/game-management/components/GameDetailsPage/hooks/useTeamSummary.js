import { useState, useEffect, useCallback } from 'react';

/**
 * Team summary management hook
 * Handles team summary state and dialog management
 * @param {object} game - The game object
 */
export function useTeamSummary(game) {
  const [teamSummary, setTeamSummary] = useState({
    defenseSummary: "",
    midfieldSummary: "",
    attackSummary: "",
    generalSummary: "",
  });
  
  const [showTeamSummaryDialog, setShowTeamSummaryDialog] = useState(false);
  const [selectedSummaryType, setSelectedSummaryType] = useState(null);

  // Load team summaries from game data
  useEffect(() => {
    if (!game) return;
    
    if (game.defenseSummary || game.midfieldSummary || game.attackSummary || game.generalSummary) {
      setTeamSummary({
        defenseSummary: game.defenseSummary || "",
        midfieldSummary: game.midfieldSummary || "",
        attackSummary: game.attackSummary || "",
        generalSummary: game.generalSummary || "",
      });
    }
  }, [game]);

  // Handle team summary dialog click
  const handleTeamSummaryClick = useCallback((summaryType) => {
    setSelectedSummaryType(summaryType);
    setShowTeamSummaryDialog(true);
  }, []);

  // Handle team summary save
  const handleTeamSummarySave = useCallback((summaryType, value) => {
    setTeamSummary((prev) => ({
      ...prev,
      [`${summaryType}Summary`]: value
    }));
  }, []);

  // Get current summary value for the dialog
  const getCurrentSummaryValue = useCallback(() => {
    if (!selectedSummaryType) return "";
    return teamSummary[`${selectedSummaryType}Summary`] || "";
  }, [selectedSummaryType, teamSummary]);

  return {
    teamSummary,
    setTeamSummary,
    showTeamSummaryDialog,
    setShowTeamSummaryDialog,
    selectedSummaryType,
    setSelectedSummaryType,
    handleTeamSummaryClick,
    handleTeamSummarySave,
    getCurrentSummaryValue,
  };
}

