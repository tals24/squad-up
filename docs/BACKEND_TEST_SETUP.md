# Backend Test Setup Guide

## Quick Start

**Prerequisites**: MongoDB must be running on `localhost:27017`

```bash
# Start MongoDB (if not already running)
# On Windows with MongoDB installed:
# - Check if MongoDB service is running in Services
# - Or start manually: mongod --dbpath "C:\data\db"

# Run tests
cd backend
npm test
```

---

## What Was Fixed

### 1. Test Script Configuration ✅
**File**: `backend/package.json`

**Before**:
```json
"test": "echo \"Error: no test specified\" && exit 1"
```

**After**:
```json
"test": "jest",
"test:watch": "jest --watch",
"test:coverage": "jest --coverage"
```

### 2. Jest Configuration ✅
**File**: `backend/jest.config.js` (created)

- Configured to run tests in `**/__tests__/**/*.test.js`
- Set test timeout to 30 seconds for database operations
- Configured coverage collection

### 3. App Server Start Prevention ✅
**File**: `backend/src/app.js`

**Change**: Prevented server from starting during tests:
```javascript
// Start server (only if not in test environment and not already started)
if (process.env.NODE_ENV !== 'test' && !module.parent) {
  app.listen(PORT, () => {
    // ...
  });
}
```

### 4. Test File Improvements ✅
**File**: `backend/src/routes/__tests__/games.draft.test.js`

- Added error handling in `beforeAll`
- Increased timeout to 60 seconds
- Added cleanup of test data
- Added console logs for debugging

---

## Current Status

✅ **Test script configured** - `npm test` now runs Jest  
✅ **Jest config created** - Tests will be discovered and run  
✅ **Server start prevention** - App won't start during tests  
⚠️ **MongoDB required** - Tests need MongoDB running on localhost:27017

---

## Error: MongoDB Not Running

If you see this error:
```
MongooseServerSelectionError: connect ECONNREFUSED ::1:27017, connect ECONNREFUSED 127.0.0.1:27017
```

**Solution**: Start MongoDB server

**Windows**:
1. Check if MongoDB service is running: `services.msc` → Look for "MongoDB"
2. Start MongoDB service if not running
3. Or start manually: `mongod --dbpath "C:\data\db"`

**Alternative**: Use MongoDB Atlas (cloud) for tests:
1. Create a free cluster at https://www.mongodb.com/cloud/atlas
2. Get connection string
3. Set `MONGODB_TEST_URI` environment variable:
   ```bash
   $env:MONGODB_TEST_URI="mongodb+srv://user:pass@cluster.mongodb.net/test-db"
   ```

---

## Test Commands

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- games.draft.test.js
```

---

## Test Structure

Tests are located in: `backend/src/routes/__tests__/`

Current test file:
- `games.draft.test.js` - Tests for Draft API (Security/Integrity)

---

## Environment Variables

Tests use these environment variables (with defaults):

- `NODE_ENV=test` - Set automatically by Jest
- `MONGODB_TEST_URI` - Defaults to `mongodb://localhost:27017/test-draft-autosave`
- `JWT_SECRET` - Defaults to `test-secret-key`

To override, create `.env.test` file or set environment variables before running tests.

