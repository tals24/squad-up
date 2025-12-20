import { useState, useEffect, useCallback } from 'react';

import {
  fetchGoals,
  createGoal,
  updateGoal,
  deleteGoal,
} from '../../../api/goalsApi';
import {
  fetchSubstitutions,
  createSubstitution,
  updateSubstitution,
  deleteSubstitution,
} from '../../../api/substitutionsApi';
import {
  fetchCards,
  createCard,
  updateCard,
  deleteCard,
} from '../../../api/cardsApi';
import {
  fetchMatchTimeline,
} from '../../../api/timelineApi';
import {
  fetchPlayerStats,
} from '../../../api/playerStatsApi';

/**
 * Game events management hook
 * Handles goals, substitutions, cards, and timeline
 * @param {string} gameId - The ID of the game
 * @param {object} game - The game object
 * @param {function} setFinalScore - Function to update final score
 */
export function useGameEvents(gameId, game, setFinalScore) {
  const [goals, setGoals] = useState([]);
  const [substitutions, setSubstitutions] = useState([]);
  const [cards, setCards] = useState([]);
  const [timeline, setTimeline] = useState([]);

  // Load all events when game is loaded
  useEffect(() => {
    if (!gameId || !game) return;
    
    // Create AbortController for this fetch
    const abortController = new AbortController();
    let isMounted = true;
    
    const loadEvents = async () => {
      try {
        const [goalsData, subsData, cardsData, timelineData] = await Promise.all([
          fetchGoals(gameId),
          fetchSubstitutions(gameId),
          fetchCards(gameId),
          fetchMatchTimeline(gameId).catch(() => []),
        ]);
        
        if (!isMounted) return;
        
        setGoals(goalsData);
        setSubstitutions(subsData);
        setCards(cardsData);
        setTimeline(timelineData);
      } catch (error) {
        // Ignore abort errors (component unmounted)
        if (error.name === 'AbortError') {
          console.log('🚫 [useGameEvents] Load events cancelled (component unmounted)');
          return;
        }
        if (isMounted) {
          console.error('Error fetching game events:', error);
        }
      }
    };
    
    loadEvents();

    // Cleanup: Cancel fetch and mark as unmounted
    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, [gameId, game]);

  // Calculate score from goals when goals are loaded or changed
  useEffect(() => {
    if (!goals || goals.length === 0) return;

    let teamGoalsCount = 0;
    let opponentGoalsCount = 0;

    goals.forEach(goal => {
      if (goal.goalCategory === 'OpponentGoal' || goal.isOpponentGoal) {
        opponentGoalsCount++;
      } else {
        teamGoalsCount++;
      }
    });

    setFinalScore(prev => {
      if (prev.ourScore !== teamGoalsCount || prev.opponentScore !== opponentGoalsCount) {
        return {
          ourScore: teamGoalsCount,
          opponentScore: opponentGoalsCount
        };
      }
      return prev;
    });
  }, [goals, setFinalScore]);

  // Helper: Refresh team stats (used after events change)
  const refreshTeamStats = useCallback(async () => {
    if (!gameId || !game || game.status !== 'Played') return;

    try {
      await fetchPlayerStats(gameId);
      console.log('✅ [useGameEvents] Refreshed team stats');
    } catch (error) {
      console.error('Error refreshing team stats:', error);
    }
  }, [gameId, game]);

  // Goal handlers
  const handleSaveGoal = async (goalData) => {
    const isEditing = goalData._id;
    
    try {
      if (isEditing) {
        const updatedGoal = await updateGoal(gameId, goalData._id, goalData);
        setGoals(prevGoals => prevGoals.map(g => g._id === updatedGoal._id ? updatedGoal : g));
      } else {
        const newGoal = await createGoal(gameId, goalData);
        setGoals(prevGoals => [...prevGoals, newGoal]);
      }
      
      // Refresh goals list and timeline
      const updatedGoals = await fetchGoals(gameId);
      setGoals(updatedGoals);
      
      const timelineData = await fetchMatchTimeline(gameId);
      setTimeline(timelineData);
      
      await refreshTeamStats();
    } catch (error) {
      console.error('Error saving goal:', error);
      throw error;
    }
  };

  const handleDeleteGoal = async (goalId) => {
    if (!window.confirm('Are you sure you want to delete this goal?')) return;

    try {
      await deleteGoal(gameId, goalId);
      setGoals(prevGoals => prevGoals.filter(g => g._id !== goalId));
      await refreshTeamStats();
    } catch (error) {
      console.error('Error deleting goal:', error);
      alert('Failed to delete goal: ' + error.message);
    }
  };

  // Opponent Goal handler
  const handleSaveOpponentGoal = async (opponentGoalData) => {
    try {
      // Save opponent goal to database with isOpponentGoal flag
      const goalData = {
        minute: opponentGoalData.minute,
        goalType: opponentGoalData.goalType || 'open-play',
        isOpponentGoal: true, // ⚠️ KEY: Marks as opponent goal
      };
      
      await createGoal(gameId, goalData);
      
      // Refresh goals list to include the new opponent goal
      const updatedGoals = await fetchGoals(gameId);
      setGoals(updatedGoals);
      
      // Refresh timeline
      const timelineData = await fetchMatchTimeline(gameId);
      setTimeline(timelineData);
      
      // Refresh team stats (no player stats change, but keep consistency)
      await refreshTeamStats();
    } catch (error) {
      console.error('Error saving opponent goal:', error);
      throw error;
    }
  };

  // Substitution handlers
  const handleSaveSubstitution = async (subData) => {
    const isEditing = subData._id;
    
    try {
      if (isEditing) {
        const updatedSub = await updateSubstitution(gameId, subData._id, subData);
        setSubstitutions(prevSubs => prevSubs.map(s => s._id === updatedSub._id ? updatedSub : s));
      } else {
        const newSub = await createSubstitution(gameId, subData);
        setSubstitutions(prevSubs => [...prevSubs, newSub]);
      }
      
      const timelineData = await fetchMatchTimeline(gameId);
      setTimeline(timelineData);
      
      await refreshTeamStats();
    } catch (error) {
      console.error('Error saving substitution:', error);
      throw error;
    }
  };

  const handleDeleteSubstitution = async (subId) => {
    if (!window.confirm('Are you sure you want to delete this substitution?')) return;

    try {
      await deleteSubstitution(gameId, subId);
      setSubstitutions(prevSubs => prevSubs.filter(s => s._id !== subId));
      await refreshTeamStats();
    } catch (error) {
      console.error('Error deleting substitution:', error);
      alert('Failed to delete substitution: ' + error.message);
    }
  };

  // Card handlers
  const handleSaveCard = async (cardData) => {
    const isEditing = cardData._id;
    
    try {
      if (isEditing) {
        const updatedCard = await updateCard(gameId, cardData._id, cardData);
        setCards(prevCards => prevCards.map(c => c._id === updatedCard._id ? updatedCard : c));
      } else {
        const newCard = await createCard(gameId, cardData);
        setCards(prevCards => [...prevCards, newCard]);
      }
      
      // Refresh cards list and timeline
      const updatedCards = await fetchCards(gameId);
      setCards(updatedCards);
      
      const timelineData = await fetchMatchTimeline(gameId);
      setTimeline(timelineData);
      
      if (cardData.cardType === 'red' || cardData.cardType === 'second-yellow') {
        await refreshTeamStats();
      }
    } catch (error) {
      console.error('Error saving card:', error);
      throw error;
    }
  };

  const handleDeleteCard = async (cardId) => {
    if (!window.confirm('Are you sure you want to delete this card?')) return;

    try {
      await deleteCard(gameId, cardId);
      setCards(prevCards => prevCards.filter(c => c._id !== cardId));
      await refreshTeamStats();
    } catch (error) {
      console.error('Error deleting card:', error);
      alert('Failed to delete card: ' + error.message);
    }
  };

  return {
    // State
    goals,
    setGoals,
    substitutions,
    setSubstitutions,
    cards,
    setCards,
    timeline,
    setTimeline,
    
    // Handlers
    handleSaveGoal,
    handleSaveOpponentGoal,
    handleDeleteGoal,
    handleSaveSubstitution,
    handleDeleteSubstitution,
    handleSaveCard,
    handleDeleteCard,
    refreshTeamStats,
  };
}

