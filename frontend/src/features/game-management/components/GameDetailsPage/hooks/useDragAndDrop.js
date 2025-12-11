import { useState, useCallback } from 'react';

import { validatePlayerPosition } from '../../../utils/squadValidation';

/**
 * Drag and drop management hook
 * Handles player dragging and dropping on formation positions
 * @param {object} formation - Current formation
 * @param {function} setFormation - Function to update formation
 * @param {function} updatePlayerStatus - Function to update player status
 * @param {object} positions - Formation positions configuration
 * @param {function} setManualFormationMode - Function to enable manual formation mode
 * @param {function} showConfirmation - Function to show confirmation modal
 */
export function useDragAndDrop(
  formation,
  setFormation,
  updatePlayerStatus,
  positions,
  setManualFormationMode,
  showConfirmation
) {
  const [draggedPlayer, setDraggedPlayer] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [pendingPlayerPosition, setPendingPlayerPosition] = useState(null);

  // Handle drag start
  const handleDragStart = useCallback((e, player) => {
    console.log('🚀 DRAG START:', {
      playerName: player.fullName,
      playerId: player._id,
    });
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", player._id);
    setDraggedPlayer(player);
    setIsDragging(true);
    setManualFormationMode(true);
    console.log('🎯 Manual formation mode ENABLED');
  }, [setManualFormationMode]);

  // Handle drag end
  const handleDragEnd = useCallback(() => {
    console.log('🏁 DRAG END');
    setDraggedPlayer(null);
    setIsDragging(false);
  }, []);

  // Execute the actual position drop logic
  const executePositionDrop = useCallback((player, posId) => {
    console.log(`✅ Assigning player ${player.fullName} to position ${posId}`);
    
    setFormation((prev) => {
      const updated = { ...prev };
      
      // Remove player from any existing position
      Object.keys(updated).forEach((key) => {
        if (updated[key]?._id === player._id) {
          console.log(`🧹 Removing ${player.fullName} from position ${key}`);
          updated[key] = null;
        }
      });
      
      // Assign to new position
      updated[posId] = player;
      
      return updated;
    });
    
    updatePlayerStatus(player._id, "Starting Lineup");
    
    setIsDragging(false);
    setDraggedPlayer(null);
  }, [setFormation, updatePlayerStatus]);

  // Handle position drop
  const handlePositionDrop = useCallback((e, posId) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('📍 DROP EVENT FIRED:', {
      posId,
      draggedPlayer: draggedPlayer ? draggedPlayer.fullName : 'NULL',
    });
    
    if (!draggedPlayer) {
      console.error('❌ No dragged player in state!');
      return;
    }
    
    // Get position data for validation
    const positionData = positions[posId];
    
    // Validate player position
    const positionValidation = validatePlayerPosition(draggedPlayer, positionData);
    
    // If player is being placed out of position, show confirmation
    if (!positionValidation.isNaturalPosition) {
      setPendingPlayerPosition({ player: draggedPlayer, position: posId, positionData });
      showConfirmation({
        title: "Out of Position Warning",
        message: `${draggedPlayer.fullName} is being placed out of their natural position. Are you sure you want to place them here?`,
        confirmText: "Confirm",
        cancelText: "Cancel",
        onConfirm: () => executePositionDrop(draggedPlayer, posId),
        onCancel: () => {
          setIsDragging(false);
          setDraggedPlayer(null);
        },
        type: "warning"
      });
      return;
    }
    
    // If position is natural, proceed directly
    executePositionDrop(draggedPlayer, posId);
  }, [draggedPlayer, positions, showConfirmation, executePositionDrop]);

  // Handle remove player from position
  const handleRemovePlayerFromPosition = useCallback((posId) => {
    const player = formation[posId];
    if (!player) return;

    setFormation((prev) => ({ ...prev, [posId]: null }));
    updatePlayerStatus(player._id, "Not in Squad");
  }, [formation, setFormation, updatePlayerStatus]);

  return {
    draggedPlayer,
    isDragging,
    pendingPlayerPosition,
    handleDragStart,
    handleDragEnd,
    handlePositionDrop,
    executePositionDrop,
    handleRemovePlayerFromPosition,
  };
}

