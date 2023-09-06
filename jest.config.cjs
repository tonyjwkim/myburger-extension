// jest.config.cjs

module.exports = {
  transform: {
    "^.+\\.[t|j]sx?$": "babel-jest",
  },
  setupFiles: ["./jest.setup.cjs"],
  testEnvironment: "jest-environment-jsdom",
  transformIgnorePatterns: ["/node_modules/"],
};
