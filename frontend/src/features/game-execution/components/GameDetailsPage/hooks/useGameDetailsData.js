import { useState, useEffect } from 'react';
import { apiClient } from '@/shared/api/client';

/**
 * useGameDetailsData
 * 
 * Custom hook that manages game data loading and initialization.
 * Handles direct API fetch with fallback to DataProvider.
 * Initializes all game-related state: game object, players, scores, duration, summaries.
 * 
 * **Behavior**:
 * 1. Fetches game directly from API (to get latest draft data)
 * 2. Falls back to DataProvider games array if fetch fails
 * 3. Initializes: matchDuration, finalScore, teamSummary, isReadOnly
 * 4. Derives gamePlayers from global players list filtered by team
 * 
 * **Network calls**:
 * - Direct fetch to `/api/games/${gameId}` with auth header
 * - Preserves exact behavior (same endpoint, same headers, same response parsing)
 * 
 * @param {string} gameId - Game ID from URL params
 * @param {Object} dataProviderContext - Context from useData hook
 * @param {Array} dataProviderContext.games - Games array from DataProvider
 * @param {Array} dataProviderContext.players - Players array from DataProvider
 * @param {Array} dataProviderContext.teams - Teams array from DataProvider
 * 
 * @returns {Object} Game data and state
 * @returns {Object|null} return.game - Game object with all details
 * @returns {Array} return.gamePlayers - Players for this game's team
 * @returns {Object} return.matchDuration - Match time configuration
 * @returns {Object} return.finalScore - Current/final score
 * @returns {Object} return.teamSummary - Team performance summaries (4 types)
 * @returns {boolean} return.isReadOnly - Whether game is in read-only mode (Done status)
 * @returns {boolean} return.isFetchingGame - Loading state for initial fetch
 * @returns {Function} return.setGame - Setter for game (for external updates)
 * @returns {Function} return.setMatchDuration - Setter for match duration
 * @returns {Function} return.setFinalScore - Setter for final score
 * @returns {Function} return.setTeamSummary - Setter for team summary
 */
export function useGameDetailsData(gameId, { games, players, teams }) {
  // State for game object
  const [game, setGame] = useState(null);
  const [gamePlayers, setGamePlayers] = useState([]);
  const [isFetchingGame, setIsFetchingGame] = useState(true);
  
  // State for derived/initialized data
  const [matchDuration, setMatchDuration] = useState({
    regularTime: 90,
    firstHalfExtraTime: 0,
    secondHalfExtraTime: 0
  });
  
  const [finalScore, setFinalScore] = useState({ 
    ourScore: 0, 
    opponentScore: 0 
  });
  
  const [teamSummary, setTeamSummary] = useState({
    defenseSummary: "",
    midfieldSummary: "",
    attackSummary: "",
    generalSummary: "",
  });
  
  const [isReadOnly, setIsReadOnly] = useState(false);
  
  // Effect 1: Load game data (with direct fetch to ensure latest draft data)
  useEffect(() => {
    if (!gameId) {
      setIsFetchingGame(false);
      return;
    }

    // Fetch game directly to ensure we have latest data including lineupDraft
    const fetchGameDirectly = async () => {
      setIsFetchingGame(true); // Set loading state at the start
      try {
        // ✅ REFACTORED: Use apiClient instead of manual fetch
        const result = await apiClient.get(`/api/games/${gameId}`);
        const fetchedGame = result.data;
        
        if (fetchedGame) {
          console.log('🔍 [useGameDetailsData] Fetched game directly:', {
            gameId: fetchedGame._id,
            status: fetchedGame.status,
            hasLineupDraft: !!fetchedGame.lineupDraft,
            lineupDraft: fetchedGame.lineupDraft
          });

          // Initialize match duration from game data FIRST (before setting game)
          const gameMatchDuration = fetchedGame.matchDuration || {};
          const loadedMatchDuration = {
            regularTime: gameMatchDuration.regularTime || 90,
            firstHalfExtraTime: gameMatchDuration.firstHalfExtraTime || 0,
            secondHalfExtraTime: gameMatchDuration.secondHalfExtraTime || 0,
          };
          
          setMatchDuration(loadedMatchDuration);
          
          // Set game object, ensuring matchDuration is included
          setGame({
            ...fetchedGame,
            matchDuration: loadedMatchDuration
          });
          setIsReadOnly(fetchedGame.status === "Done");
          
          // Initialize score from game data if available
          if (fetchedGame.ourScore !== null && fetchedGame.ourScore !== undefined) {
            setFinalScore({
              ourScore: fetchedGame.ourScore || 0,
              opponentScore: fetchedGame.opponentScore || 0,
            });
          } else {
            setFinalScore({
              ourScore: 0,
              opponentScore: 0,
            });
          }
          
          if (fetchedGame.defenseSummary || fetchedGame.midfieldSummary || fetchedGame.attackSummary || fetchedGame.generalSummary) {
            setTeamSummary({
              defenseSummary: fetchedGame.defenseSummary || "",
              midfieldSummary: fetchedGame.midfieldSummary || "",
              attackSummary: fetchedGame.attackSummary || "",
              generalSummary: fetchedGame.generalSummary || "",
            });
          }
          
          return; // Successfully loaded from direct fetch
        }

        // If no data in result, fall through to DataProvider fallback
        // Fallback: Use games array from DataProvider if direct fetch fails
        if (!games || games.length === 0) {
          return;
        }

        const foundGame = games.find((g) => g._id === gameId);
        if (foundGame) {
          // 🔍 DEBUG: Log backend game data
          console.log('🔍 [useGameDetailsData] Backend game data (fallback):', {
            gameId: foundGame._id,
            status: foundGame.status,
            matchDuration: foundGame.matchDuration,
            hasMatchDuration: !!foundGame.matchDuration,
            matchDurationType: typeof foundGame.matchDuration,
            matchDurationKeys: foundGame.matchDuration ? Object.keys(foundGame.matchDuration) : null,
            hasLineupDraft: !!foundGame.lineupDraft,
            lineupDraft: foundGame.lineupDraft,
            lineupDraftType: typeof foundGame.lineupDraft
          });
          
          // Initialize match duration from game data FIRST (before setting game)
          // This ensures we have the correct matchDuration before game object is set
          const gameMatchDuration = foundGame.matchDuration || {};
          const loadedMatchDuration = {
            regularTime: gameMatchDuration.regularTime || 90,
            firstHalfExtraTime: gameMatchDuration.firstHalfExtraTime || 0,
            secondHalfExtraTime: gameMatchDuration.secondHalfExtraTime || 0,
          };
          
          // 🔍 DEBUG: Log loaded matchDuration
          console.log('🔍 [useGameDetailsData] Loaded matchDuration state:', loadedMatchDuration);
          console.log('🔍 [useGameDetailsData] Calculated total:', loadedMatchDuration.regularTime + loadedMatchDuration.firstHalfExtraTime + loadedMatchDuration.secondHalfExtraTime);
          
          setMatchDuration(loadedMatchDuration);
          
          // Set game object, ensuring matchDuration is included
          setGame({
            ...foundGame,
            matchDuration: loadedMatchDuration
          });
          setIsReadOnly(foundGame.status === "Done");
          
          // Initialize score from game data if available, otherwise will be calculated from goals
          if (foundGame.ourScore !== null && foundGame.ourScore !== undefined) {
            setFinalScore({
              ourScore: foundGame.ourScore || 0,
              opponentScore: foundGame.opponentScore || 0,
            });
          } else {
            // If no score stored, initialize to 0-0 (will be calculated from goals)
            setFinalScore({
              ourScore: 0,
              opponentScore: 0,
            });
          }
          
          if (foundGame.defenseSummary || foundGame.midfieldSummary || foundGame.attackSummary || foundGame.generalSummary) {
            setTeamSummary({
              defenseSummary: foundGame.defenseSummary || "",
              midfieldSummary: foundGame.midfieldSummary || "",
              attackSummary: foundGame.attackSummary || "",
              generalSummary: foundGame.generalSummary || "",
            });
          }
        }
      } catch (error) {
        console.error('[useGameDetailsData] Error fetching game directly:', error);
      } finally {
        // Always set loading to false after fetch completes (success or failure)
        setIsFetchingGame(false);
      }
    };

    fetchGameDirectly();
  }, [gameId, games]);
  
  // Effect 2: Load team players (derive gamePlayers from global players)
  useEffect(() => {
    if (!game || !players || players.length === 0) return;

    const teamObj = game.team || game.Team || game.teamId || game.TeamId;
    const teamId = typeof teamObj === "object" ? teamObj._id : teamObj;

    if (!teamId) return;

    // Find the team to get its name
    const team = teams.find(t => t._id === teamId);
    const teamName = team?.name || "Unknown Team";

    // Filter players for this team
    const filteredPlayers = players.filter(player => {
      const playerTeamObj = player.team || player.Team || player.teamId || player.TeamId;
      const playerTeamId = typeof playerTeamObj === "object" ? playerTeamObj._id : playerTeamObj;
      return playerTeamId === teamId;
    });

    console.log(`🔍 [useGameDetailsData] Filtered ${filteredPlayers.length} players for team ${teamName} (ID: ${teamId})`);
    setGamePlayers(filteredPlayers);
  }, [game, players, teams]);
  
  return {
    // Core game data
    game,
    gamePlayers,
    isFetchingGame,
    
    // Derived/initialized state
    matchDuration,
    finalScore,
    teamSummary,
    isReadOnly,
    
    // Setters (for external updates)
    setGame,
    setMatchDuration,
    setFinalScore,
    setTeamSummary,
    setIsReadOnly, // ✅ FIX: Expose for handleConfirmFinalSubmission & handleEditReport
  };
}

