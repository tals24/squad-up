# Backend Test Setup

## Installation

Add these dependencies to `backend/package.json`:

```json
{
  "devDependencies": {
    "jest": "^29.7.0",
    "supertest": "^6.3.3",
    "@types/jest": "^29.5.0"
  }
}
```

Then run:
```bash
cd backend
npm install
```

## Test Configuration

Create `backend/jest.config.js`:

```javascript
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/__tests__/**',
    '!src/app.js'
  ],
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.js']
};
```

## Environment Variables

Create `backend/.env.test`:

```
MONGODB_TEST_URI=mongodb://localhost:27017/test-draft-autosave
JWT_SECRET=test-secret-key
NODE_ENV=test
```

## Running Tests

```bash
cd backend
npm test
```

## Note

The current test file (`games.draft.test.js`) uses direct database operations for testing the logic.
For full integration tests with HTTP requests, you'll need to:

1. Export the Express app from `app.js` (or create a separate app factory)
2. Use supertest to make HTTP requests
3. Set up a test database connection

Example app export in `app.js`:
```javascript
// At the end of app.js
if (process.env.NODE_ENV !== 'production') {
  module.exports = app; // Export for testing
}
```

