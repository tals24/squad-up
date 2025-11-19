module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/__tests__/**',
    '!src/app.js',
    '!src/worker.js'
  ],
  testTimeout: 30000, // 30 seconds for database operations
  // Setup file is optional - only use if it exists
  setupFilesAfterEnv: []
};

