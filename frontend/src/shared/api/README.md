# API Architecture

This directory contains the shared API infrastructure and authentication logic. Feature-specific APIs are located in their respective feature folders.

## Structure

```
shared/api/
├── client.js           # Base API client with auth and error handling
├── endpoints.js        # API endpoint constants
├── auth.js            # Authentication (User entity, JWT service)
├── legacy.js          # ⚠️ Legacy API functions (to be migrated)
├── index.js           # Barrel export
└── README.md          # This file
```

## API Client

The `apiClient` from `client.js` provides a consistent interface for all API calls:

```javascript
import { apiClient } from '@/shared/api/client';

// GET request
const data = await apiClient.get('/api/endpoint');

// POST request
const result = await apiClient.post('/api/endpoint', { data });

// PUT request
const updated = await apiClient.put('/api/endpoint/id', { data });

// DELETE request
await apiClient.delete('/api/endpoint/id');
```

**Features:**
- Automatic JWT token injection
- Consistent error handling
- Base URL configuration via environment variables
- JSON content-type headers

## Authentication

The `auth.js` file exports the `User` entity for authentication operations:

```javascript
import { User } from '@/shared/api';

// Login
const user = await User.login(email, password);

// Get current user
const currentUser = User.getCurrentUser();

// Check authentication
const isAuth = User.isAuthenticated();

// Logout
await User.logout();
```

## Feature-Specific APIs

Each feature has its own `api/` folder with domain-specific API functions:

### Pattern

```javascript
// features/{feature-name}/api/{resource}Api.js
import { apiClient } from '@/shared/api/client';

export const getResources = async () => {
  return await apiClient.get('/api/resources');
};

export const createResource = async (data) => {
  return await apiClient.post('/api/resources', data);
};

// ... other CRUD operations
```

### Barrel Export

Each feature API folder has an `index.js` that exports all API functions:

```javascript
// features/{feature-name}/api/index.js
export * from './resourceApi';
```

## Current Feature APIs

| Feature | API Files | Status |
|---------|-----------|--------|
| **game-management** | 8 files (cardsApi, difficultyAssessmentApi, gameApi, goalsApi, playerMatchStatsApi, playerStatsApi, substitutionsApi, timelineApi) | ✅ Complete |
| **player-management** | playerApi.js | ✅ Complete |
| **reporting** | reportApi.js (game + scout reports) | ✅ Complete |
| **team-management** | teamApi.js, formationApi.js | ✅ Complete |
| **training-management** | trainingApi.js (sessions, drills, plans) | ✅ Complete |
| **user-management** | userApi.js | ✅ Complete |
| **drill-system** | drillApi.js | ✅ Complete |
| **analytics** | - | ⏳ Pending (uses DataProvider) |
| **settings** | - | ⏳ Pending (minimal needs) |

**Note:** All other features have complete API modules with backward-compatible { data, error } format.

## ✅ Legacy API Migration Complete (Phase 3)

All legacy API functions have been successfully migrated to feature-specific APIs!

```javascript
// ✅ Use feature-specific APIs
import { getPlayers } from '@/features/player-management/api';
import { getTeams } from '@/features/team-management/api';
import { getDrills } from '@/features/drill-system/api';
```

**Completed:**
- ✅ All legacy functions migrated to feature-specific APIs
- ✅ All imports updated across the codebase
- ✅ `legacy.js` deleted
- ✅ Backward compatibility maintained with { data, error } format

## Best Practices

### 1. Use Feature-Specific APIs

Always import from feature-specific APIs when available:

```javascript
// ✅ Good
import { getPlayers } from '@/features/player-management/api';

// ❌ Bad
import { getPlayers } from '@/shared/api/legacy';
```

### 2. Consistent Function Naming

Follow these naming conventions:

- `getResources()` - Get all resources
- `getResourceById(id)` - Get single resource
- `createResource(data)` - Create new resource
- `updateResource(id, data)` - Update resource
- `deleteResource(id)` - Delete resource

### 3. JSDoc Comments

Always include JSDoc comments for API functions:

```javascript
/**
 * Get all players
 * @returns {Promise<Array>} List of all players
 */
export const getPlayers = async () => {
  return await apiClient.get('/api/players');
};
```

### 4. Error Handling

The API client handles errors automatically. Catch them in your components:

```javascript
try {
  const players = await getPlayers();
  // Handle success
} catch (error) {
  console.error('Failed to fetch players:', error);
  // Handle error
}
```

## Environment Variables

Configure the backend URL via environment variables:

```env
VITE_BACKEND_URL=http://localhost:3001
```

Default fallback: `http://localhost:3001`

## Migration Guide

### From Legacy API to Feature-Specific API

1. **Check if feature API exists**
   - Look in `features/{feature-name}/api/`
   - If it doesn't exist, create it following the pattern above

2. **Update imports**
   ```javascript
   // Before
   import { getPlayers } from '@/shared/api';
   
   // After
   import { getPlayers } from '@/features/player-management/api';
   ```

3. **Test thoroughly**
   - Verify all functionality works
   - Check for any breaking changes

4. **Remove from legacy.js**
   - Once all imports are updated
   - Remove the function from `legacy.js`

## Future Improvements

- [ ] Create analytics API (if needed)
- [ ] Create settings API (if needed)
- [x] ~~Migrate all legacy functions~~ ✅ COMPLETE (Phase 3)
- [x] ~~Delete `legacy.js`~~ ✅ COMPLETE (Phase 3)
- [ ] Add request/response interceptors
- [ ] Add request caching
- [ ] Add retry logic for failed requests
- [ ] Add request cancellation support
- [ ] Migrate to direct apiClient usage (remove { data, error } wrapper)

