// React 19 requires this flag so act() works with the test renderer.
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// Global Jest setup: AsyncStorage is used by ThemeProvider and the screens,
// so give it the official mock to avoid hitting the native module in tests.
jest.mock('@react-native-async-storage/async-storage', () =>
    require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
