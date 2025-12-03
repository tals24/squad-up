// Import our JWT auth service
import jwtAuthService from '../services/jwtAuthService';

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

// Export User with JWT Auth methods
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