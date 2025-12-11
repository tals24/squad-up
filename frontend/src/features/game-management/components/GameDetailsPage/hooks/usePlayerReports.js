import { useState, useEffect, useMemo, useCallback } from 'react';

import { useData } from '@/app/providers/DataProvider';
import { useToast } from '@/shared/ui/primitives/use-toast';
import { fetchPlayerStats } from '../../../api/playerStatsApi';
import { fetchPlayerMatchStats } from '../../../api/playerMatchStatsApi';

/**
 * Player reports and stats management hook
 * Handles player performance reports, match stats, and auto-fill functionality
 * @param {string} gameId - The ID of the game
 * @param {object} game - The game object
 * @param {Array} gamePlayers - List of team players
 * @param {object} localRosterStatuses - Current roster statuses
 */
export function usePlayerReports(gameId, game, gamePlayers, localRosterStatuses) {
  const { gameReports, isLoading: dataLoading } = useData();
  const { toast } = useToast();
  
  const [localPlayerReports, setLocalPlayerReports] = useState({});
  const [localPlayerMatchStats, setLocalPlayerMatchStats] = useState({});
  const [teamStats, setTeamStats] = useState({});
  const [isLoadingTeamStats, setIsLoadingTeamStats] = useState(false);

  // Load existing game reports
  useEffect(() => {
    if (dataLoading || !gameId || !gameReports || !Array.isArray(gameReports)) return;

    const reportsForGame = gameReports.filter((report) => {
      const reportGameId = typeof report.game === "object" && report.game !== null 
        ? report.game._id 
        : report.game;
      return reportGameId === gameId;
    });

    if (reportsForGame.length > 0) {
      const reports = {};
      reportsForGame.forEach((report) => {
        const playerId = typeof report.player === "object" && report.player !== null 
          ? report.player._id 
          : report.player;
        reports[playerId] = {
          rating_physical: report.rating_physical !== undefined ? report.rating_physical : 3,
          rating_technical: report.rating_technical !== undefined ? report.rating_technical : 3,
          rating_tactical: report.rating_tactical !== undefined ? report.rating_tactical : 3,
          rating_mental: report.rating_mental !== undefined ? report.rating_mental : 3,
          notes: report.notes || "",
          minutesPlayed: report.minutesPlayed || 0,
          goals: report.goals || 0,
          assists: report.assists || 0,
        };
      });
      
      setLocalPlayerReports(reports);
    }
  }, [gameId, gameReports, dataLoading]);

  // Load report draft for Played games
  useEffect(() => {
    if (!gameId || !game || (game.status !== 'Played' && game.status !== 'Done')) return;

    if (game.reportDraft && typeof game.reportDraft === 'object') {
      const draft = game.reportDraft;
      
      if (draft.playerReports) {
        setLocalPlayerReports(prev => ({
          ...prev,
          ...draft.playerReports
        }));
      }

      if (draft.playerMatchStats) {
        setLocalPlayerMatchStats(prev => ({
          ...prev,
          ...draft.playerMatchStats
        }));
      }
    }
  }, [gameId, game]);

  // Pre-fetch player stats for Played and Done games
  useEffect(() => {
    if (!gameId || !game || (game.status !== 'Played' && game.status !== 'Done')) {
      setTeamStats({});
      setLocalPlayerMatchStats({});
      return;
    }

    const loadTeamStats = async () => {
      setIsLoadingTeamStats(true);
      try {
        const stats = await fetchPlayerStats(gameId);
        setTeamStats(stats);
        
        const matchStats = await fetchPlayerMatchStats(gameId);
        const statsMap = {};
        matchStats.forEach(stat => {
          const playerId = typeof stat.playerId === 'object' ? stat.playerId._id : stat.playerId;
          statsMap[playerId] = {
            fouls: {
              committedRating: stat.fouls?.committedRating || 0,
              receivedRating: stat.fouls?.receivedRating || 0
            },
            shooting: {
              volumeRating: stat.shooting?.volumeRating || 0,
              accuracyRating: stat.shooting?.accuracyRating || 0
            },
            passing: {
              volumeRating: stat.passing?.volumeRating || 0,
              accuracyRating: stat.passing?.accuracyRating || 0,
              keyPassesRating: stat.passing?.keyPassesRating || 0
            },
            duels: {
              involvementRating: stat.duels?.involvementRating || 0,
              successRating: stat.duels?.successRating || 0
            }
          };
        });
        
        setLocalPlayerMatchStats(prev => ({
          ...prev,
          ...statsMap
        }));
      } catch (error) {
        console.error('Error pre-fetching player stats:', error);
        setTeamStats({});
      } finally {
        setIsLoadingTeamStats(false);
      }
    };

    loadTeamStats();
  }, [gameId, game?.status]);

  // Helper: Check if player has report
  const hasReport = useCallback((playerId) => {
    return localPlayerReports[playerId] !== undefined && 
           localPlayerReports[playerId].rating_physical !== undefined;
  }, [localPlayerReports]);

  // Helper: Check if player needs report
  const needsReport = useCallback((playerId) => {
    const status = localRosterStatuses[playerId];
    return (status === "Starting Lineup" || status === "Bench") && !hasReport(playerId);
  }, [localRosterStatuses, hasReport]);

  // Count missing reports
  const missingReportsCount = useMemo(() => {
    if (!gamePlayers || gamePlayers.length === 0) return 0;
    
    let count = 0;
    gamePlayers.forEach((player) => {
      if (needsReport(player._id)) count++;
    });
    return count;
  }, [gamePlayers, needsReport]);

  // Calculate remaining players without reports (for Auto-Fill button)
  const remainingReportsCount = useMemo(() => {
    if (!gamePlayers || gamePlayers.length === 0) return 0;
    if (game?.status !== 'Played') return 0;
    
    const playersWithReports = Object.keys(localPlayerReports).length;
    const totalPlayers = gamePlayers.length;
    return Math.max(0, totalPlayers - playersWithReports);
  }, [gamePlayers, localPlayerReports, game?.status]);

  // Auto-fill remaining reports with default values
  const handleAutoFillRemaining = useCallback(() => {
    if (!gamePlayers || gamePlayers.length === 0) return;
    if (game?.status !== 'Played') return;

    const playersWithoutReports = gamePlayers.filter(
      player => !localPlayerReports[player._id]
    );

    if (playersWithoutReports.length === 0) {
      toast({
        title: "No players to fill",
        description: "All players already have reports.",
        variant: "default",
      });
      return;
    }

    const defaultReport = {
      rating_physical: 3,
      rating_technical: 3,
      rating_tactical: 3,
      rating_mental: 3,
      notes: "Did not play / No specific observations.",
    };

    const newReports = {};
    playersWithoutReports.forEach(player => {
      newReports[player._id] = defaultReport;
    });

    setLocalPlayerReports(prev => ({
      ...prev,
      ...newReports
    }));

    toast({
      title: "Reports auto-filled",
      description: `Applied default reports to ${playersWithoutReports.length} player${playersWithoutReports.length > 1 ? 's' : ''}.`,
      variant: "default",
    });
  }, [gamePlayers, game?.status, localPlayerReports, toast]);

  return {
    localPlayerReports,
    setLocalPlayerReports,
    localPlayerMatchStats,
    setLocalPlayerMatchStats,
    teamStats,
    isLoadingTeamStats,
    hasReport,
    needsReport,
    missingReportsCount,
    remainingReportsCount,
    handleAutoFillRemaining,
  };
}

