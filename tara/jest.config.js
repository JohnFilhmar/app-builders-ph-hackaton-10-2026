module.exports = {
  preset: 'jest-expo',
  globalSetup: '<rootDir>/jest.globalSetup.js',
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
  testPathIgnorePatterns: ['/node_modules/', '/android/', '/ios/'],
};
