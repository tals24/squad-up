import { useState, useEffect, useMemo } from 'react';

import { useData } from '@/app/providers/DataProvider';

/**
 * Core game state management hook
 * Handles game loading, status management, match duration, and team players
 * @param {string} gameId - The ID of the game to load
 */
export function useGameCore(gameId) {
  const { games, players, isLoading, error } = useData();
  
  // Main state
  const [game, setGame] = useState(null);
  const [gamePlayers, setGamePlayers] = useState([]);
  const [matchDuration, setMatchDuration] = useState({
    regularTime: 90,
    firstHalfExtraTime: 0,
    secondHalfExtraTime: 0
  });
  const [finalScore, setFinalScore] = useState({ 
    ourScore: 0, 
    opponentScore: 0 
  });
  
  // Local loading state for direct game fetch
  const [isFetchingGame, setIsFetchingGame] = useState(true);
  
  // Load game data (with direct fetch to ensure latest draft data)
  useEffect(() => {
    if (!gameId) {
      setIsFetchingGame(false);
      return;
    }

    const fetchGameDirectly = async () => {
      setIsFetchingGame(true);
      try {
        const response = await fetch(`http://localhost:3001/api/games/${gameId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          },
        });

        if (response.ok) {
          const result = await response.json();
          const fetchedGame = result.data;
          
          if (fetchedGame) {
            console.log('🔍 [useGameCore] Fetched game directly:', {
              gameId: fetchedGame._id,
              status: fetchedGame.status,
              hasLineupDraft: !!fetchedGame.lineupDraft,
            });

            // Initialize match duration from game data
            const gameMatchDuration = fetchedGame.matchDuration || {};
            const loadedMatchDuration = {
              regularTime: gameMatchDuration.regularTime || 90,
              firstHalfExtraTime: gameMatchDuration.firstHalfExtraTime || 0,
              secondHalfExtraTime: gameMatchDuration.secondHalfExtraTime || 0,
            };
            
            setMatchDuration(loadedMatchDuration);
            setGame({
              ...fetchedGame,
              matchDuration: loadedMatchDuration
            });
            
            // Initialize score from game data
            if (fetchedGame.ourScore !== null && fetchedGame.ourScore !== undefined) {
              setFinalScore({
                ourScore: fetchedGame.ourScore || 0,
                opponentScore: fetchedGame.opponentScore || 0,
              });
            }
            
            setIsFetchingGame(false);
            return;
          }
        }

        // Fallback: Use games array from DataProvider
        if (!games || games.length === 0) {
          setIsFetchingGame(false);
          return;
        }

        const foundGame = games.find((g) => g._id === gameId);
        if (foundGame) {
          const gameMatchDuration = foundGame.matchDuration || {};
          const loadedMatchDuration = {
            regularTime: gameMatchDuration.regularTime || 90,
            firstHalfExtraTime: gameMatchDuration.firstHalfExtraTime || 0,
            secondHalfExtraTime: gameMatchDuration.secondHalfExtraTime || 0,
          };
          
          setMatchDuration(loadedMatchDuration);
          setGame({
            ...foundGame,
            matchDuration: loadedMatchDuration
          });
          
          if (foundGame.ourScore !== null && foundGame.ourScore !== undefined) {
            setFinalScore({
              ourScore: foundGame.ourScore || 0,
              opponentScore: foundGame.opponentScore || 0,
            });
          }
        }
      } catch (error) {
        console.error('Error fetching game directly:', error);
      } finally {
        setIsFetchingGame(false);
      }
    };

    fetchGameDirectly();
  }, [gameId, games]);

  // Load team players
  useEffect(() => {
    if (!game || !players || players.length === 0) return;

    const teamObj = game.team || game.Team || game.teamId || game.TeamId;
    const teamId = typeof teamObj === "object" ? teamObj._id : teamObj;

    if (!teamId) return;

    const teamPlayers = players.filter((player) => {
      const playerTeamObj = player.team || player.Team || player.teamId || player.TeamId;
      const playerTeamId = typeof playerTeamObj === "object" ? playerTeamObj._id : playerTeamObj;
      return playerTeamId === teamId;
    });

    setGamePlayers(teamPlayers);
  }, [game, players]);

  // Create efficient lookup map for player data
  const playerMap = useMemo(() => {
    const map = new Map();
    gamePlayers.forEach(player => {
      map.set(player._id, player);
    });
    return map;
  }, [gamePlayers]);
  
  // Derived state
  const isScheduled = game?.status === 'Scheduled';
  const isPlayed = game?.status === 'Played';
  const isDone = game?.status === 'Done';

  return {
    // State
    game,
    setGame,
    gamePlayers,
    matchDuration,
    setMatchDuration,
    finalScore,
    setFinalScore,
    isFetchingGame,
    
    // Derived
    isScheduled,
    isPlayed,
    isDone,
    playerMap,
    
    // From DataProvider
    isLoading,
    error,
  };
}

