import { useState, useEffect } from 'react';

import { useFeature } from '@/shared/hooks';
import { useToast } from '@/shared/ui/primitives/use-toast';
import {
  fetchDifficultyAssessment,
  updateDifficultyAssessment,
  deleteDifficultyAssessment,
} from '../../../api/difficultyAssessmentApi';

/**
 * Difficulty assessment management hook
 * Handles loading, saving, and deleting difficulty assessments
 * @param {string} gameId - The ID of the game
 * @param {object} game - The game object
 */
export function useDifficultyAssessment(gameId, game) {
  const { toast } = useToast();
  const isDifficultyAssessmentEnabled = useFeature('gameDifficultyAssessmentEnabled', game?.team);
  
  const [difficultyAssessment, setDifficultyAssessment] = useState(null);

  // Load difficulty assessment
  useEffect(() => {
    if (!gameId || !isDifficultyAssessmentEnabled) return;

    const loadDifficultyAssessment = async () => {
      try {
        const assessment = await fetchDifficultyAssessment(gameId);
        setDifficultyAssessment(assessment);
      } catch (error) {
        console.error('Error fetching difficulty assessment:', error);
        setDifficultyAssessment(null);
      }
    };

    loadDifficultyAssessment();
  }, [gameId, isDifficultyAssessmentEnabled]);

  const handleSaveDifficultyAssessment = async (assessment) => {
    try {
      const updated = await updateDifficultyAssessment(gameId, assessment);
      setDifficultyAssessment(updated);
      toast({
        title: "Success",
        description: "Difficulty assessment saved successfully",
      });
    } catch (error) {
      console.error('Error saving difficulty assessment:', error);
      toast({
        title: "Error",
        description: "Failed to save difficulty assessment",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleDeleteDifficultyAssessment = async () => {
    try {
      await deleteDifficultyAssessment(gameId);
      setDifficultyAssessment(null);
      toast({
        title: "Success",
        description: "Difficulty assessment deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting difficulty assessment:', error);
      toast({
        title: "Error",
        description: "Failed to delete difficulty assessment",
        variant: "destructive",
      });
      throw error;
    }
  };

  return {
    difficultyAssessment,
    isDifficultyAssessmentEnabled,
    handleSaveDifficultyAssessment,
    handleDeleteDifficultyAssessment,
  };
}

