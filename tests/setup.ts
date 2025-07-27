// Jest setup file
// Add any global test setup here

// Increase timeout for integration tests
if (process.env.TEST_TYPE === 'integration') {
  jest.setTimeout(30000);
}

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};