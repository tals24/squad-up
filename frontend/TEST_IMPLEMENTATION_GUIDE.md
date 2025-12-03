# Critical Test Suite Implementation Guide

## Overview

This guide explains how to run and maintain the Critical Test Suite for the Draft & Autosave System.

## Test Files Created

### Backend Tests (7 tests)
- **Location**: `backend/src/routes/__tests__/games.draft.test.js`
- **Tests**: SI-001 through SI-007 (Security/Integrity)
- **Framework**: Jest + Supertest (needs installation)

### Frontend Merge Logic Tests (7 tests)
- **Location**: `src/features/game-management/components/GameDetailsPage/__tests__/draftMerge.test.jsx`
- **Tests**: DL-001 through DL-007 (Data Loss Prevention)
- **Framework**: Jest + React Testing Library (already installed)

### Hook Behavior Tests (2 tests)
- **Location**: `src/hooks/__tests__/useAutosave.test.js`
- **Tests**: SP-001, SP-002 (Spam Prevention)
- **Framework**: Jest + React Testing Library (already installed)

### E2E Critical Flow Tests (2 tests)
- **Location**: `src/features/game-management/components/GameDetailsPage/__tests__/draftE2E.test.jsx`
- **Tests**: E2E-001, E2E-002 (End-to-End)
- **Framework**: Jest + React Testing Library (already installed)

## Setup Instructions

### 1. Backend Test Setup

```bash
cd backend
npm install --save-dev jest supertest @types/jest
```

Create `backend/jest.config.js`:
```javascript
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/__tests__/**',
    '!src/app.js'
  ]
};
```

Update `backend/package.json`:
```json
{
  "scripts": {
    "test": "NODE_ENV=test jest",
    "test:watch": "NODE_ENV=test jest --watch"
  }
}
```

### 2. Frontend Tests (Already Set Up)

Frontend tests use existing Jest configuration. No additional setup needed.

## Running Tests

### Run All Tests
```bash
# Frontend tests
npm test

# Backend tests
cd backend
npm test
```

### Run Specific Test Suites
```bash
# Frontend merge logic tests
npm test draftMerge

# Hook behavior tests
npm test useAutosave

# E2E tests
npm test draftE2E

# Backend draft API tests
cd backend
npm test games.draft
```

### Run Tests in Watch Mode
```bash
npm test -- --watch
```

## Test Coverage

To check coverage:
```bash
npm test -- --coverage
```

## Important Notes

### Backend Tests

The current backend test file (`games.draft.test.js`) tests the logic directly using database operations. For full HTTP integration tests:

1. **Export Express app** from `backend/src/app.js`:
   ```javascript
   // At the end of app.js
   if (process.env.NODE_ENV !== 'production') {
     module.exports = app;
   }
   ```

2. **Update tests** to use supertest:
   ```javascript
   const request = require('supertest');
   const app = require('../../app');
   
   const response = await request(app)
     .put(`/api/games/${gameId}/draft`)
     .set('Authorization', `Bearer ${token}`)
     .send(data);
   ```

### Frontend Tests

The merge logic tests use a simplified mock implementation. To test the actual component:

1. Import the actual `GameDetailsPage` component
2. Mock all dependencies (useData, router, etc.)
3. Test the actual merge logic in the component

### Mock Data

All tests use mock data. For realistic testing:

1. Create test fixtures in `__tests__/fixtures/`
2. Use factories to generate test data
3. Clean up test data after each test

## Test Maintenance

### Adding New Tests

When adding new critical tests:

1. Follow the naming convention: `{Category}-{Number}: {Description}`
2. Add test ID reference to `CRITICAL_TEST_SUITE_DRAFT_AUTOSAVE.md`
3. Keep tests focused on preventing data loss or critical bugs

### Updating Tests

When implementation changes:

1. Update tests to match new behavior
2. Verify tests still catch the critical bugs they're designed to catch
3. Don't add tests for standard framework behavior

## Troubleshooting

### Backend Tests Fail

- **Issue**: MongoDB connection errors
- **Solution**: Ensure MongoDB is running or use `mongodb-memory-server`

- **Issue**: JWT token errors
- **Solution**: Set `JWT_SECRET` in test environment

### Frontend Tests Fail

- **Issue**: Module resolution errors
- **Solution**: Check `jest.config.cjs` moduleNameMapper settings

- **Issue**: Timer-related errors
- **Solution**: Ensure `jest.useFakeTimers()` is properly set up

## Next Steps

1. ✅ Test files created
2. ⏳ Install backend test dependencies
3. ⏳ Set up test database
4. ⏳ Run tests and fix any issues
5. ⏳ Add to CI/CD pipeline

## References

- [Critical Test Suite Document](./docs/CRITICAL_TEST_SUITE_DRAFT_AUTOSAVE.md)
- [Full Test Strategy](./docs/TEST_STRATEGY_DRAFT_AUTOSAVE.md)
- [Testing Guide](./docs/TESTING_GUIDE_REPORT_DRAFT_AUTOSAVE.md)

