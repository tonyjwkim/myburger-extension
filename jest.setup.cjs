// jest.setup.cjs

global.chrome = {
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
    },
  },
  identity: {
    getAuthToken: jest.fn(),
  },
  runtime: {
    lastError: null,
    sendMessage: jest.fn(),
  },
};
