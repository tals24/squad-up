import { useMemo } from 'react';

/**
 * Custom hook for user role display logic
 * Handles role determination and team assignment for display
 * 
 * @param {Object} params - Parameters object
 * @param {Object} params.currentUser - Current authenticated user
 * @param {Array} params.users - All users from backend
 * @param {Array} params.teams - All teams
 * @returns {Object} - Role display information
 */
export const useUserRole = ({ currentUser, users, teams }) => {
  return useMemo(() => {
    if (!currentUser) {
      return {
        roleDisplay: "User Terminal",
        isAdmin: false,
        isCoach: false,
        isDivisionManager: false,
        isDepartmentManager: false,
        coachTeam: null
      };
    }

    const backendUser = users.find(u => 
      u.email && u.email.toLowerCase() === currentUser.email.toLowerCase()
    );
    
    const userRole = currentUser.role;
    let roleDisplay = `${userRole} Terminal`;
    let coachTeam = null;

    // Determine role display based on user type
    if (userRole === 'Coach' && backendUser) {
      // Find the team this coach manages
      coachTeam = teams.find(team => 
        team.coach && team.coach._id === backendUser._id
      );
      if (coachTeam) {
        roleDisplay = `${coachTeam.teamName} Coach`;
      } else {
        roleDisplay = "Coach";
      }
    } else if (userRole === 'Division Manager' && backendUser?.department) {
      roleDisplay = `${backendUser.department} Manager`;
    } else if (userRole === 'Department Manager') {
      roleDisplay = "Department Manager";
    } else if (userRole === 'Admin') {
      roleDisplay = "System Administrator";
    }

    return {
      roleDisplay,
      isAdmin: userRole === 'Admin',
      isCoach: userRole === 'Coach',
      isDivisionManager: userRole === 'Division Manager',
      isDepartmentManager: userRole === 'Department Manager',
      coachTeam
    };
  }, [currentUser, users, teams]);
};
