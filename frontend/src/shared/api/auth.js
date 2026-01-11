/**
 * Authentication API
 * Wraps JWT authentication service for use across the application
 */

import jwtAuthService from '../../services/jwtAuthService';

/**
 * User entity with authentication methods
 * @deprecated Individual methods should be called directly from jwtAuthService
 * This wrapper is maintained for backward compatibility during migration
 */
export const User = {
  me: () => jwtAuthService.me(),
  login: (email, password) => jwtAuthService.login(email, password),
  logout: () => jwtAuthService.signOut(),
  onAuthStateChange: (callback) => jwtAuthService.onAuthStateChange(callback),
  isAuthenticated: () => jwtAuthService.isAuthenticated(),
  getCurrentUser: () => jwtAuthService.currentUser,
  verifyToken: () => jwtAuthService.verifyToken(),
  getAuthToken: () => jwtAuthService.getAuthToken(),
};

// Export jwtAuthService directly for modern usage
export { jwtAuthService };
