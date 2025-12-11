import { useMemo } from 'react';

/**
 * Custom hook for derived/computed game state
 * Consolidates all useMemo calculations to reduce main component size
 */
export function useDerivedGameState({
  formation,
  gamePlayers,
  getPlayerStatus,
  goals,
  localPlayerReports,
  teamSummary,
  finalScore,
  matchDuration,
  localPlayerMatchStats,
}) {
  const playersOnPitch = useMemo(() => {
    return Object.values(formation).filter((player) => player !== null);
  }, [formation]);

  const benchPlayers = useMemo(() => {
    return gamePlayers.filter((player) => {
      const status = getPlayerStatus(player._id);
      return status === "Bench";
    });
  }, [gamePlayers, getPlayerStatus]);

  const squadPlayers = useMemo(() => {
    return gamePlayers.filter((player) => {
      const status = getPlayerStatus(player._id);
      const isOnPitch = playersOnPitch.some((p) => p._id === player._id);
      const isBench = status === "Bench";
      return !isOnPitch && !isBench;
    });
  }, [gamePlayers, playersOnPitch, getPlayerStatus]);

  const activeGamePlayers = useMemo(() => {
    return gamePlayers.filter((player) => {
      const status = getPlayerStatus(player._id);
      return status === "Starting Lineup" || status === "Bench";
    });
  }, [gamePlayers, getPlayerStatus]);

  const startingLineupMap = useMemo(() => {
    const map = {};
    gamePlayers.forEach(player => {
      const status = getPlayerStatus(player._id);
      if (status === 'Starting Lineup') {
        map[player._id] = true;
      }
    });
    return map;
  }, [gamePlayers, getPlayerStatus]);

  const squadPlayersMap = useMemo(() => {
    const map = {};
    gamePlayers.forEach(player => {
      const status = getPlayerStatus(player._id);
      if (status === 'Starting Lineup' || status === 'Bench') {
        map[player._id] = status;
      }
    });
    return map;
  }, [gamePlayers, getPlayerStatus]);

  const matchStats = useMemo(() => {
    const scorerMap = new Map();
    const assisterMap = new Map();
    let topRated = null;
    let maxRating = 0;

    (goals || []).forEach((goal) => {
      if (goal.goalCategory === 'OpponentGoal' || goal.isOpponentGoal) return;

      if (goal.scorerId && goal.scorerId._id) {
        const scorerId = goal.scorerId._id;
        const scorerName = goal.scorerId.fullName || goal.scorerId.name || 'Unknown';
        scorerMap.set(scorerId, {
          name: scorerName,
          count: (scorerMap.get(scorerId)?.count || 0) + 1
        });
      }

      if (goal.assistedById && goal.assistedById._id) {
        const assisterId = goal.assistedById._id;
        const assisterName = goal.assistedById.fullName || goal.assistedById.name || 'Unknown';
        assisterMap.set(assisterId, {
          name: assisterName,
          count: (assisterMap.get(assisterId)?.count || 0) + 1
        });
      }
    });

    Object.entries(localPlayerReports).forEach(([playerId, report]) => {
      const player = gamePlayers.find((p) => p._id === playerId);
      if (!player) return;

      const avgRating = (report.rating_physical + report.rating_technical + report.rating_tactical + report.rating_mental) / 4;
      if (avgRating > maxRating) {
        maxRating = avgRating;
        topRated = player.fullName;
      }
    });

    return { 
      scorers: Array.from(scorerMap.values()),
      assists: Array.from(assisterMap.values()),
      topRated 
    };
  }, [goals, localPlayerReports, gamePlayers]);

  const reportDataForAutosave = useMemo(() => ({
    teamSummary,
    finalScore,
    matchDuration,
    playerReports: localPlayerReports,
    playerMatchStats: localPlayerMatchStats
  }), [teamSummary, finalScore, matchDuration, localPlayerReports, localPlayerMatchStats]);

  return {
    playersOnPitch,
    benchPlayers,
    squadPlayers,
    activeGamePlayers,
    startingLineupMap,
    squadPlayersMap,
    matchStats,
    reportDataForAutosave,
  };
}

