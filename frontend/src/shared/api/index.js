// Shared API - Barrel Export
export { apiClient, default } from './client';
export { API_ENDPOINTS } from './endpoints';

// Authentication
export { User, jwtAuthService } from './auth';

// Legacy API (to be migrated to feature-specific APIs)
export * from './legacy';

