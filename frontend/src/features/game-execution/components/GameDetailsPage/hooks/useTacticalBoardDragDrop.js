import { useState } from 'react';

/**
 * Custom hook to manage drag-and-drop behavior for the tactical board
 *
 * Responsibilities:
 * 1. Track drag state (isDragging, draggedPlayer)
 * 2. Handle drag start/end events
 * 3. Handle position drop with validation
 * 4. Show confirmation for out-of-position placements
 * 5. Update formation and player status on successful drop
 * 6. Enable manual formation mode when user drags players
 *
 * @param {Object} params
 * @param {Object} params.positions - Formation positions config
 * @param {Object} params.formation - Current formation object
 * @param {Function} params.setFormation - Setter for formation
 * @param {Function} params.updatePlayerStatus - Function to update player roster status
 * @param {Function} params.setManualFormationMode - Setter for manual mode
 * @param {Function} params.showConfirmation - Function to show confirmation dialog
 * @param {Function} params.validatePlayerPosition - Function to validate player position match
 *
 * @returns {Object} return.isDragging - Whether a drag operation is in progress
 * @returns {Object} return.draggedPlayer - The player currently being dragged
 * @returns {Function} return.handleDragStart - Handler for drag start event
 * @returns {Function} return.handleDragEnd - Handler for drag end event
 * @returns {Function} return.handlePositionDrop - Handler for position drop event
 * @returns {Function} return.handleRemovePlayerFromPosition - Handler to remove player from position
 */
export function useTacticalBoardDragDrop({
  positions,
  formation,
  setFormation,
  updatePlayerStatus,
  setManualFormationMode,
  showConfirmation,
  validatePlayerPosition,
}) {
  // Drag state
  const [draggedPlayer, setDraggedPlayer] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  /**
   * Handle drag start event
   * Initiates drag operation and enables manual formation mode
   */
  const handleDragStart = (e, player) => {
    console.log('🚀 [useTacticalBoardDragDrop] DRAG START:', {
      playerName: player.fullName,
      playerId: player._id,
      playerKitNumber: player.kitNumber,
    });

    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', player._id);
    setDraggedPlayer(player);
    setIsDragging(true);
    setManualFormationMode(true);

    console.log('🎯 [useTacticalBoardDragDrop] Manual formation mode ENABLED');
  };

  /**
   * Handle drag end event
   * Cleans up drag state
   */
  const handleDragEnd = () => {
    console.log('🏁 [useTacticalBoardDragDrop] DRAG END');
    setDraggedPlayer(null);
    setIsDragging(false);
  };

  /**
   * Execute the actual position drop logic
   * Updates formation and player status
   */
  const executePositionDrop = (player, posId) => {
    console.log(
      `✅ [useTacticalBoardDragDrop] Assigning player ${player.fullName} to position ${posId}`
    );

    setFormation((prev) => {
      const updated = { ...prev };

      // Remove player from any existing position first
      Object.keys(updated).forEach((key) => {
        if (updated[key]?._id === player._id) {
          console.log(
            `🧹 [useTacticalBoardDragDrop] Removing ${player.fullName} from position ${key}`
          );
          updated[key] = null;
        }
      });

      // Assign to new position
      updated[posId] = player;

      console.log(
        '🔄 [useTacticalBoardDragDrop] Formation updated:',
        Object.entries(updated)
          .filter(([_, p]) => p !== null)
          .map(([pos, p]) => ({ pos, player: p.fullName }))
      );

      return updated;
    });

    // Update player status to Starting Lineup
    updatePlayerStatus(player._id, 'Starting Lineup');

    // Clean up drag state
    setIsDragging(false);
    setDraggedPlayer(null);
  };

  /**
   * Handle position drop event
   * Validates player position and shows confirmation if out of position
   */
  const handlePositionDrop = (e, posId) => {
    e.preventDefault();
    e.stopPropagation();

    console.log('📍 [useTacticalBoardDragDrop] DROP EVENT FIRED:', {
      posId,
      draggedPlayer: draggedPlayer ? draggedPlayer.fullName : 'NULL',
      eventTarget: e.target.className,
      currentTarget: e.currentTarget.className,
    });

    // Guard: No dragged player
    if (!draggedPlayer) {
      console.error('❌ [useTacticalBoardDragDrop] No dragged player in state!');
      return;
    }

    // Get position data for validation
    const positionData = positions[posId];

    // Validate player position match
    const positionValidation = validatePlayerPosition(draggedPlayer, positionData);

    console.log('🔍 [useTacticalBoardDragDrop] Position validation:', {
      player: draggedPlayer.fullName,
      playerPosition: draggedPlayer.position,
      targetPosition: positionData?.label,
      isNaturalPosition: positionValidation.isNaturalPosition,
    });

    // If player is being placed out of position, show confirmation
    if (!positionValidation.isNaturalPosition) {
      console.log('⚠️ [useTacticalBoardDragDrop] Out of position - showing confirmation dialog');

      showConfirmation({
        title: 'Out of Position Warning',
        message: `${draggedPlayer.fullName} is being placed out of their natural position. Are you sure you want to place them here?`,
        confirmText: 'Confirm',
        cancelText: 'Cancel',
        onConfirm: () => {
          console.log('✅ [useTacticalBoardDragDrop] User confirmed out-of-position placement');
          executePositionDrop(draggedPlayer, posId);
        },
        onCancel: () => {
          console.log('❌ [useTacticalBoardDragDrop] User cancelled out-of-position placement');
          setIsDragging(false);
          setDraggedPlayer(null);
        },
        type: 'warning',
      });
      return;
    }

    // If position is natural, proceed directly
    console.log('✅ [useTacticalBoardDragDrop] Natural position - proceeding with drop');
    executePositionDrop(draggedPlayer, posId);
  };

  /**
   * Remove player from a specific position
   * Sets position to null and updates player status to "Not in Squad"
   */
  const handleRemovePlayerFromPosition = (posId) => {
    const player = formation[posId];

    if (!player) {
      console.log(`⚠️ [useTacticalBoardDragDrop] No player at position ${posId} to remove`);
      return;
    }

    console.log(`🗑️ [useTacticalBoardDragDrop] Removing ${player.fullName} from position ${posId}`);

    setFormation((prev) => ({ ...prev, [posId]: null }));
    updatePlayerStatus(player._id, 'Not in Squad');
  };

  return {
    // State
    isDragging,
    draggedPlayer,

    // Handlers
    handleDragStart,
    handleDragEnd,
    handlePositionDrop,
    handleRemovePlayerFromPosition,
  };
}
