// Import our new auth service
import authService from '../services/authService';

// Create a safe wrapper for entities (keeping for future use)
const createSafeEntity = (entity) => {
  if (!entity) {
    return {
      find: () => Promise.resolve({ data: [], error: null }),
      create: () => Promise.reject(new Error('Entity not available')),
      update: () => Promise.reject(new Error('Entity not available')),
      delete: () => Promise.reject(new Error('Entity not available')),
    };
  }
  return entity;
};

// Export entities with safe fallbacks (these will be replaced in future phases)
export const TrainingSession = createSafeEntity(null);
export const SessionDrill = createSafeEntity(null);

// Export User with Firebase Auth methods
export const User = {
  me: () => authService.me(),
  login: (email, password) => authService.login(email, password),
  loginWithGoogle: () => authService.loginWithGoogle(),
  loginWithRedirect: (redirectUrl) => authService.loginWithRedirect(redirectUrl),
  logout: () => authService.logout(),
  register: (email, password, displayName) => authService.register(email, password, displayName),
  resetPassword: (email) => authService.resetPassword(email),
  onAuthStateChange: (callback) => authService.onAuthStateChange(callback),
  isAuthenticated: () => authService.isAuthenticated(),
  getCurrentUser: () => authService.getCurrentUser(),
};