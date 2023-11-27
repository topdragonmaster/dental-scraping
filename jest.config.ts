import { join } from 'path';
import type { JestConfigWithTsJest } from 'ts-jest';

function generateJestConfig(): JestConfigWithTsJest {
  return {
    collectCoverage: true,
    collectCoverageFrom: ['src/exercises/**/*.ts'],
    coverageDirectory: join(__dirname, 'build', 'jest'),
    coverageThreshold: {
      global: {
        branches: 0,
        functions: 0,
        lines: 0,
        statements: 0,
      },
    },
    moduleNameMapper: {
      '^@src/(.*)$': '<rootDir>/src/$1',
    },
    modulePathIgnorePatterns: ['<rootDir>/src/gen'],
    preset: 'ts-jest',
    testEnvironment: 'node',
    testRegex: '.*\\.spec\\.ts$',
    testTimeout: 120000,
  };
}

export default generateJestConfig();
