/**
 * Jest Setup File for Backend Tests
 * 
 * This file runs before all tests to set up the test environment
 */

// Set test environment variables if not already set
process.env.NODE_ENV = process.env.NODE_ENV || 'test';
process.env.MONGODB_TEST_URI = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/test-draft-autosave';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key';

// Suppress console logs during tests (optional - comment out if you want to see logs)
// global.console = {
//   ...console,
//   log: jest.fn(),
//   debug: jest.fn(),
//   info: jest.fn(),
//   warn: jest.fn(),
//   error: jest.fn(),
// };

