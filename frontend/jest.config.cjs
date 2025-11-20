// jest.config.cjs
/* eslint-disable @typescript-eslint/no-require-imports */
const nextJest = require("next/jest");

const createJestConfig = nextJest({
  dir: "./",
});

const customJestConfig = {
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  testEnvironment: "jsdom",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  transform: {
    "^.+\\.(t|j)sx?$": ["ts-jest", { tsconfig: "<rootDir>/tsconfig.json" }],
  },
  transformIgnorePatterns: [
    "node_modules/(?!(lucide-react|@radix-ui|react-markdown)/)",
  ],
};

module.exports = createJestConfig(customJestConfig);
