import { fetchGoals, createGoal, updateGoal, deleteGoal } from '../../../api/goalsApi';
import { fetchMatchTimeline } from '../../../api/timelineApi';

/**
 * useGoalsHandlers
 * 
 * Manages all goal-related CRUD operations:
 * - Add new goal (team or opponent)
 * - Edit existing goal
 * - Delete goal
 * - Update scores and timeline
 * 
 * @param {Object} params
 * @param {string} params.gameId - Game ID
 * @param {Array} params.goals - Current goals array
 * @param {Function} params.setGoals - Set goals state
 * @param {Object} params.finalScore - Final score object
 * @param {Function} params.setFinalScore - Set final score
 * @param {Function} params.setTimeline - Set timeline state
 * @param {Object} params.selectedGoal - Currently selected goal for editing
 * @param {Function} params.setSelectedGoal - Set selected goal
 * @param {Function} params.setShowGoalDialog - Show/hide goal dialog
 * @param {Function} params.refreshTeamStats - Refresh team stats after goal changes
 * 
 * @returns {Object} Goal handlers
 */
export function useGoalsHandlers({
  gameId,
  goals,
  setGoals,
  finalScore,
  setFinalScore,
  setTimeline,
  selectedGoal,
  setSelectedGoal,
  setShowGoalDialog,
  refreshTeamStats,
}) {
  
  /**
   * Open dialog to add new goal
   */
  const handleAddGoal = () => {
    setSelectedGoal(null);
    setShowGoalDialog(true);
  };

  /**
   * Open dialog to edit existing goal
   */
  const handleEditGoal = (goal) => {
    setSelectedGoal(goal);
    setShowGoalDialog(true);
    // GoalDialog will detect if it's an opponent goal by checking goal.goalCategory or isOpponentGoal
  };

  /**
   * Delete a goal (with confirmation)
   */
  const handleDeleteGoal = async (goalId) => {
    if (!window.confirm('Are you sure you want to delete this goal?')) {
      return;
    }

    try {
      await deleteGoal(gameId, goalId);
      setGoals(prevGoals => prevGoals.filter(g => g._id !== goalId));
      // Refresh team stats after goal deletion (affects goals/assists)
      refreshTeamStats();
    } catch (error) {
      console.error('[useGoalsHandlers] Error deleting goal:', error);
      alert('Failed to delete goal: ' + error.message);
    }
  };

  /**
   * Save goal (create or update)
   */
  const handleSaveGoal = async (goalData) => {
    try {
      if (selectedGoal) {
        // Update existing goal
        const updatedGoal = await updateGoal(gameId, selectedGoal._id, goalData);
        setGoals(prevGoals => prevGoals.map(g => g._id === updatedGoal._id ? updatedGoal : g));
        
        // Recalculate score from goals
        const updatedGoals = await fetchGoals(gameId);
        setGoals(updatedGoals);
      } else {
        // Create new goal
        const newGoal = await createGoal(gameId, goalData);
        setGoals(prevGoals => [...prevGoals, newGoal]);
        
        // Increment team score when team goal is recorded
        setFinalScore(prev => ({
          ...prev,
          ourScore: prev.ourScore + 1
        }));
      }
      
      // Refresh goals list to ensure consistency
      const updatedGoals = await fetchGoals(gameId);
      setGoals(updatedGoals);
      
      // Refresh team stats after goal save (affects goals/assists)
      refreshTeamStats();
      
      // Refresh timeline to update player states
      try {
        const timelineData = await fetchMatchTimeline(gameId);
        setTimeline(timelineData);
      } catch (error) {
        console.error('[useGoalsHandlers] Error refreshing timeline:', error);
      }
      
      setShowGoalDialog(false);
      setSelectedGoal(null);
    } catch (error) {
      console.error('[useGoalsHandlers] Error saving goal:', error);
      throw error; // Re-throw to let GoalDialog handle it
    }
  };

  /**
   * Save opponent goal
   */
  const handleSaveOpponentGoal = async (opponentGoalData) => {
    try {
      // Save opponent goal to database
      const goalData = {
        minute: opponentGoalData.minute,
        goalType: opponentGoalData.goalType || 'open-play',
        isOpponentGoal: true
      };
      
      await createGoal(gameId, goalData);
      
      // Increment opponent score when opponent goal is recorded
      const newOpponentScore = finalScore.opponentScore + 1;
      setFinalScore(prev => ({
        ...prev,
        opponentScore: newOpponentScore
      }));
      
      // Refresh goals list to include the new opponent goal
      const updatedGoals = await fetchGoals(gameId);
      setGoals(updatedGoals);
      
      // Refresh team stats after opponent goal save (no player stats change, but keep consistency)
      refreshTeamStats();
    } catch (error) {
      console.error('[useGoalsHandlers] Error saving opponent goal:', error);
      throw error;
    }
  };

  return {
    handleAddGoal,
    handleEditGoal,
    handleDeleteGoal,
    handleSaveGoal,
    handleSaveOpponentGoal,
  };
}

