/**
 * useFormationHandlers
 *
 * Manages formation-related interactions:
 * - Change formation type
 * - Position click handling
 * - Player assignment to positions
 *
 * @param {Object} params
 * @param {Object} params.formation - Current formation state
 * @param {Function} params.setFormation - Set formation state
 * @param {string} params.formationType - Current formation type
 * @param {Function} params.setFormationType - Set formation type
 * @param {Function} params.setManualFormationMode - Set manual mode flag
 * @param {string} params.selectedPosition - Currently selected position
 * @param {Function} params.setSelectedPosition - Set selected position
 * @param {Function} params.setSelectedPositionData - Set position data
 * @param {Function} params.setShowPlayerSelectionDialog - Show/hide dialog
 * @param {Function} params.updatePlayerStatus - Update player roster status
 *
 * @returns {Object} Formation handlers
 */
export function useFormationHandlers({
  formation,
  setFormation,
  formationType,
  setFormationType,
  setManualFormationMode,
  selectedPosition,
  setSelectedPosition,
  setSelectedPositionData,
  setShowPlayerSelectionDialog,
  updatePlayerStatus,
}) {
  /**
   * Handle formation type change
   * Clears all position assignments when changing formation
   */
  const handleFormationChange = (newFormationType) => {
    if (
      window.confirm('Changing formation will clear all current position assignments. Continue?')
    ) {
      setFormationType(newFormationType);
      setFormation({});
    }
  };

  /**
   * Handle position click on tactical board
   * Opens player selection dialog for that position
   */
  const handlePositionClick = (posId, posData) => {
    console.log('🎯 [useFormationHandlers] Position clicked:', { posId, posData });
    setSelectedPosition(posId);
    setSelectedPositionData(posData);
    setShowPlayerSelectionDialog(true);
  };

  /**
   * Handle player selection for a position
   * Removes player from any existing position first, then assigns to new position
   */
  const handleSelectPlayerForPosition = (player) => {
    if (!selectedPosition) return;

    console.log('✅ [useFormationHandlers] Assigning player to position:', {
      posId: selectedPosition,
      player: player.fullName,
    });

    // Remove player from any existing position first
    const newFormation = { ...formation };
    Object.keys(newFormation).forEach((posId) => {
      if (newFormation[posId]?._id === player._id) {
        newFormation[posId] = null;
      }
    });

    // Assign to new position
    newFormation[selectedPosition] = player;
    setFormation(newFormation);

    // Update player status
    updatePlayerStatus(player._id, 'Starting Lineup');
    setManualFormationMode(true);

    // Close dialog and reset
    setShowPlayerSelectionDialog(false);
    setSelectedPosition(null);
    setSelectedPositionData(null);
  };

  return {
    handleFormationChange,
    handlePositionClick,
    handleSelectPlayerForPosition,
  };
}
