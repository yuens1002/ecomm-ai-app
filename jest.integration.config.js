/**
 * Jest config for integration tests only.
 * Replaces testPathIgnorePatterns to allow the __tests__/integration/ directory
 * which is excluded from the default config (requires live dev server + AI).
 *
 * Run: npm run test:integration
 */
import nextJest from "next/jest.js";

const createJestConfig = nextJest({ dir: "./" });

const config = {
  coverageProvider: "v8",
  testEnvironment: "node",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.integration.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
    "^@components/(.*)$": "<rootDir>/components/$1",
  },
  testMatch: ["**/__tests__/integration/**/*.[jt]s?(x)"],
  testPathIgnorePatterns: ["/node_modules/", "/.next/"],
  transformIgnorePatterns: ["node_modules/(?!(next-auth|@auth/core)/)"],
};

export default createJestConfig(config);
