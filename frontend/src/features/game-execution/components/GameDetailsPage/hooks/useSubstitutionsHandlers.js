import {
  fetchSubstitutions,
  createSubstitution,
  updateSubstitution,
  deleteSubstitution,
} from '../../../api/substitutionsApi';
import { fetchMatchTimeline } from '../../../api/timelineApi';

/**
 * useSubstitutionsHandlers
 *
 * Manages all substitution-related CRUD operations:
 * - Add new substitution
 * - Edit existing substitution
 * - Delete substitution
 * - Update timeline and stats
 *
 * @param {Object} params
 * @param {string} params.gameId - Game ID
 * @param {Array} params.substitutions - Current substitutions array
 * @param {Function} params.setSubstitutions - Set substitutions state
 * @param {Function} params.setTimeline - Set timeline state
 * @param {Object} params.selectedSubstitution - Currently selected substitution
 * @param {Function} params.setSelectedSubstitution - Set selected substitution
 * @param {Function} params.setShowSubstitutionDialog - Show/hide dialog
 * @param {Function} params.refreshTeamStats - Refresh team stats after changes
 * @param {Array} params.goals - Current goals array (to calculate match state)
 *
 * @returns {Object} Substitution handlers
 */
export function useSubstitutionsHandlers({
  gameId,
  substitutions,
  setSubstitutions,
  setTimeline,
  selectedSubstitution,
  setSelectedSubstitution,
  setShowSubstitutionDialog,
  refreshTeamStats,
  goals = [],
}) {
  /**
   * Open dialog to add new substitution
   */
  const handleAddSubstitution = () => {
    setSelectedSubstitution(null);
    setShowSubstitutionDialog(true);
  };

  /**
   * Open dialog to edit existing substitution
   */
  const handleEditSubstitution = (substitution) => {
    setSelectedSubstitution(substitution);
    setShowSubstitutionDialog(true);
  };

  /**
   * Delete a substitution (with confirmation)
   */
  const handleDeleteSubstitution = async (subId) => {
    if (!window.confirm('Are you sure you want to delete this substitution?')) {
      return;
    }

    try {
      await deleteSubstitution(gameId, subId);
      setSubstitutions((prevSubs) => prevSubs.filter((s) => s._id !== subId));
      // Refresh team stats after substitution deletion (affects minutes)
      refreshTeamStats();
    } catch (error) {
      console.error('[useSubstitutionsHandlers] Error deleting substitution:', error);
      alert('Failed to delete substitution: ' + error.message);
    }
  };

  /**
   * Calculate match state at a specific minute based on goals timeline
   */
  const calculateMatchState = (minute) => {
    // Count our goals and opponent goals before this minute
    const ourGoalsBeforeThis = goals.filter((g) => g.minute <= minute && !g.isOpponentGoal).length;

    const opponentGoalsBeforeThis = goals.filter(
      (g) => g.minute <= minute && g.isOpponentGoal
    ).length;

    console.log(`🔍 [useSubstitutionsHandlers] Calculating match state at minute ${minute}:`, {
      ourGoals: ourGoalsBeforeThis,
      opponentGoals: opponentGoalsBeforeThis,
    });

    if (ourGoalsBeforeThis > opponentGoalsBeforeThis) {
      return 'winning';
    } else if (ourGoalsBeforeThis < opponentGoalsBeforeThis) {
      return 'losing';
    } else {
      return 'drawing';
    }
  };

  /**
   * Save substitution (create or update)
   */
  const handleSaveSubstitution = async (subData) => {
    try {
      // Calculate match state based on goals timeline
      const matchState = calculateMatchState(subData.minute);
      const subDataWithMatchState = {
        ...subData,
        matchState,
      };

      console.log('💾 [useSubstitutionsHandlers] Saving substitution with match state:', {
        minute: subData.minute,
        matchState,
        subData: subDataWithMatchState,
      });

      if (selectedSubstitution) {
        // Update existing substitution
        const updatedSub = await updateSubstitution(
          gameId,
          selectedSubstitution._id,
          subDataWithMatchState
        );
        setSubstitutions((prevSubs) =>
          prevSubs.map((s) => (s._id === updatedSub._id ? updatedSub : s))
        );
      } else {
        // Create new substitution
        const newSub = await createSubstitution(gameId, subDataWithMatchState);
        setSubstitutions((prevSubs) => [...prevSubs, newSub]);
      }

      // Refresh team stats after substitution save (affects minutes)
      refreshTeamStats();

      // Refresh timeline to update player states
      try {
        const timelineData = await fetchMatchTimeline(gameId);
        setTimeline(timelineData);
      } catch (error) {
        console.error('[useSubstitutionsHandlers] Error refreshing timeline:', error);
      }

      setShowSubstitutionDialog(false);
      setSelectedSubstitution(null);
    } catch (error) {
      console.error('[useSubstitutionsHandlers] Error saving substitution:', error);
      throw error; // Re-throw to let SubstitutionDialog handle it
    }
  };

  return {
    handleAddSubstitution,
    handleEditSubstitution,
    handleDeleteSubstitution,
    handleSaveSubstitution,
  };
}
