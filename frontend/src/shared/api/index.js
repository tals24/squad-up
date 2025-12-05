// Shared API - Barrel Export
export { apiClient, default } from './client';
export { API_ENDPOINTS } from './endpoints';

// Authentication
export { User, jwtAuthService } from './auth';

// Data Aggregation
export { fetchAllTables } from './dataApi';

// NOTE: All other API functions have been migrated to feature-specific APIs
// Import from @/features/{feature-name}/api instead

