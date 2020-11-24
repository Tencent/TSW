module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  coverageDirectory: "coverage",
  coverageReporters: ["json", "lcov", "text"],
  collectCoverageFrom: [
    "lib/**/*.ts"
  ],
  testPathIgnorePatterns: ["/node_modules/", "/dist/"]
};
