import { useMemo } from 'react';

/**
 * Custom hook for dashboard data filtering and calculations
 * Centralizes all role-based data filtering logic
 * 
 * @param {Object} params - Parameters object
 * @param {Object} params.currentUser - Current authenticated user
 * @param {Array} params.users - All users from backend
 * @param {Array} params.teams - All teams
 * @param {Array} params.players - All players
 * @param {Array} params.reports - All reports
 * @param {Array} params.games - All games
 * @returns {Object} - Filtered data and user role
 */
export const useDashboardData = ({ currentUser, users, teams, players, reports, games }) => {
  return useMemo(() => {
    // Early return if no user or data
    if (!currentUser || !users.length) {
      return { 
        filteredTeams: [], 
        filteredPlayers: [], 
        filteredReports: [], 
        filteredGames: [], 
        userRole: '' 
      };
    }

    // Admin users see everything
    if (currentUser.role === 'admin') {
      return {
        filteredTeams: teams,
        filteredPlayers: players,
        filteredReports: reports,
        filteredGames: games,
        userRole: 'Admin'
      };
    }

    // Find backend user for role-based filtering
    const backendUser = users.find(u => 
      u.email && u.email.toLowerCase() === currentUser.email.toLowerCase()
    );
    const userRole = currentUser.role;

    let fTeams = teams;
    let fPlayers = players;
    let fGames = games;

    // Role-based filtering logic
    if (userRole === 'Coach' && backendUser) {
      // Filter teams where this user is the coach
      fTeams = teams.filter(team => 
        team.coach && team.coach._id === backendUser._id
      );
      const teamIds = fTeams.map(team => team._id);
      fPlayers = players.filter(player => 
        player.team && teamIds.includes(player.team._id)
      );
      fGames = games.filter(game => 
        game.team && teamIds.includes(game.team._id)
      );
    } else if (userRole === 'Division Manager' && backendUser?.department) {
      // Filter teams by division
      fTeams = teams.filter(team => team.division === backendUser.department);
      const teamIds = fTeams.map(team => team._id);
      fPlayers = players.filter(player => 
        player.team && teamIds.includes(player.team._id)
      );
      fGames = games.filter(game => 
        game.team && teamIds.includes(game.team._id)
      );
    } else if (userRole === 'Department Manager' && backendUser?.department) {
      // Filter teams by department
      fTeams = teams.filter(team => team.division === backendUser.department);
      const teamIds = fTeams.map(team => team._id);
      fPlayers = players.filter(player => 
        player.team && teamIds.includes(player.team._id)
      );
      fGames = games.filter(game => 
        game.team && teamIds.includes(game.team._id)
      );
    } else if (userRole !== 'Admin') {
      // Non-admin users with no specific permissions see nothing
      fTeams = [];
      fPlayers = [];
      fGames = [];
    }

    // Filter reports based on filtered players
    const playerIds = fPlayers.map(p => p._id);
    const fReports = reports.filter(report => 
      report.player && playerIds.includes(report.player._id)
    );

    const displayRole = userRole || 'Coach';

    return { 
      filteredTeams: fTeams, 
      filteredPlayers: fPlayers, 
      filteredReports: fReports, 
      filteredGames: fGames, 
      userRole: displayRole 
    };
  }, [currentUser, users, teams, players, reports, games]);
};

