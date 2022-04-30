module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    globals: {
      "ts-jest": {
        tsconfig: "tsconfig.jest.json",
      },
    },
    "roots": [
      "test"
    ],
    "testMatch": [
      "**/test/?(*.)+(spec|test).+(ts|tsx|js)"
    ],
    "transform": {
      "^.+\\.(ts|tsx)$": "ts-jest"
    },
  }