import { useState, useEffect } from 'react';
import { fetchGoals } from '../../../api/goalsApi';
import { fetchSubstitutions } from '../../../api/substitutionsApi';
import { fetchCards } from '../../../api/cardsApi';
import { fetchPlayerStats } from '../../../api/playerStatsApi';
import { fetchMatchTimeline } from '../../../api/timelineApi';
import { fetchPlayerMatchStats } from '../../../api/playerMatchStatsApi';
import { fetchDifficultyAssessment } from '../../../api/difficultyAssessmentApi';

/**
 * useEntityLoading
 * 
 * Loads all game-related entities (goals, substitutions, cards, timeline, stats, etc.)
 * Consolidates all data loading effects into one hook
 * 
 * @param {Object} params
 * @param {string} params.gameId - Game ID
 * @param {Object} params.game - Game object
 * @param {boolean} params.isDifficultyAssessmentEnabled - Feature flag
 * 
 * @returns {Object} Entity states, setters, and refresh function
 */
export function useEntityLoading({ gameId, game, isDifficultyAssessmentEnabled }) {
  const [goals, setGoals] = useState([]);
  const [substitutions, setSubstitutions] = useState([]);
  const [cards, setCards] = useState([]);
  const [difficultyAssessment, setDifficultyAssessment] = useState(null);
  const [teamStats, setTeamStats] = useState({});
  const [timeline, setTimeline] = useState([]);
  const [localPlayerMatchStats, setLocalPlayerMatchStats] = useState({});

  // Load all entities
  useEffect(() => {
    if (!gameId || !game) return;

    const loadEntities = async () => {
      try {
        console.log('🔍 [useEntityLoading] Loading entities...', {
          gameId,
          gameStatus: game?.status,
          isDifficultyAssessmentEnabled
        });
        
        // Only fetch player stats for Played/Done games
        const shouldFetchStats = game.status === 'Played' || game.status === 'Done';
        
        const [goalsData, subsData, cardsData, difficultyData, timelineData, statsData] = await Promise.all([
          fetchGoals(gameId),
          fetchSubstitutions(gameId),
          fetchCards(gameId),
          isDifficultyAssessmentEnabled ? fetchDifficultyAssessment(gameId) : Promise.resolve(null),
          fetchMatchTimeline(gameId),
          shouldFetchStats ? fetchPlayerStats(gameId) : Promise.resolve({}),
        ]);
        
        console.log('🔍 [useEntityLoading] Entities loaded:', {
          goalsCount: goalsData?.length,
          subsCount: subsData?.length,
          cardsCount: cardsData?.length,
          hasDifficultyData: !!difficultyData,
          difficultyData
        });
        
        setGoals(goalsData);
        setSubstitutions(subsData);
        setCards(cardsData);
        setDifficultyAssessment(difficultyData);
        setTimeline(timelineData);
        setTeamStats(statsData);
      } catch (error) {
        console.error('[useEntityLoading] Error loading entities:', error);
      }
    };

    loadEntities();
  }, [gameId, game, isDifficultyAssessmentEnabled]);

  // Load player match stats (for Played/Done games)
  useEffect(() => {
    if (!gameId || !game) return;
    if (game.status !== 'Played' && game.status !== 'Done') return;

    const loadPlayerMatchStats = async () => {
      try {
        const stats = await fetchPlayerMatchStats(gameId);
        const statsMap = {};
        stats.forEach(stat => {
          statsMap[stat.playerId] = stat;
        });
        setLocalPlayerMatchStats(statsMap);
      } catch (error) {
        console.error('[useEntityLoading] Error loading player match stats:', error);
      }
    };

    loadPlayerMatchStats();
  }, [gameId, game]);

  // Refresh team stats function
  const refreshTeamStats = async () => {
    if (!gameId || !game) return;
    // Only fetch stats for Played/Done games
    if (game.status !== 'Played' && game.status !== 'Done') {
      console.log('⏸️ [useEntityLoading] Skipping refreshTeamStats - game status:', game.status);
      return;
    }
    
    try {
      console.log('🔄 [useEntityLoading] Refreshing team stats for game:', gameId);
      const stats = await fetchPlayerStats(gameId);
      const firstPlayerId = Object.keys(stats)[0];
      console.log('✅ [useEntityLoading] Team stats refreshed:', {
        playerCount: Object.keys(stats).length,
        allPlayerIds: Object.keys(stats),
        samplePlayerId: firstPlayerId,
        sampleStats: firstPlayerId ? stats[firstPlayerId] : null,
        allStats: stats
      });
      setTeamStats(stats);
    } catch (error) {
      console.error('❌ [useEntityLoading] Error refreshing team stats:', error);
    }
  };

  return {
    goals,
    setGoals,
    substitutions,
    setSubstitutions,
    cards,
    setCards,
    difficultyAssessment,
    setDifficultyAssessment,
    teamStats,
    setTeamStats,
    timeline,
    setTimeline,
    localPlayerMatchStats,
    setLocalPlayerMatchStats,
    refreshTeamStats,
  };
}

