import { updateDifficultyAssessment, deleteDifficultyAssessment } from '../../../api/difficultyAssessmentApi';

/**
 * useDifficultyHandlers
 * 
 * Manages difficulty assessment operations:
 * - Save difficulty assessment
 * - Delete difficulty assessment
 * 
 * @param {Object} params
 * @param {string} params.gameId - Game ID
 * @param {Function} params.setDifficultyAssessment - Set difficulty assessment state
 * @param {Function} params.toast - Toast notification function
 * 
 * @returns {Object} Difficulty handlers
 */
export function useDifficultyHandlers({
  gameId,
  setDifficultyAssessment,
  toast,
}) {
  
  /**
   * Save difficulty assessment
   */
  const handleSaveDifficultyAssessment = async (assessment) => {
    try {
      const updated = await updateDifficultyAssessment(gameId, assessment);
      setDifficultyAssessment(updated);
      toast({
        title: "Success",
        description: "Difficulty assessment saved successfully",
      });
    } catch (error) {
      console.error('[useDifficultyHandlers] Error saving difficulty assessment:', error);
      toast({
        title: "Error",
        description: "Failed to save difficulty assessment",
        variant: "destructive",
      });
      throw error;
    }
  };

  /**
   * Delete difficulty assessment
   */
  const handleDeleteDifficultyAssessment = async () => {
    try {
      await deleteDifficultyAssessment(gameId);
      setDifficultyAssessment(null);
      toast({
        title: "Success",
        description: "Difficulty assessment deleted successfully",
      });
    } catch (error) {
      console.error('[useDifficultyHandlers] Error deleting difficulty assessment:', error);
      toast({
        title: "Error",
        description: "Failed to delete difficulty assessment",
        variant: "destructive",
      });
      throw error;
    }
  };

  return {
    handleSaveDifficultyAssessment,
    handleDeleteDifficultyAssessment,
  };
}

