module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  coverageDirectory: "coverage",
  coverageReporters: ["json", "lcov", "text"],
  testPathIgnorePatterns: ["/node_modules/", "/dist/"]
};
