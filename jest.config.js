module.exports = {
  testEnvironment: 'node',
  transform: {
    '^.+\.jsx?$': 'babel-jest'
  },
  transformIgnorePatterns: [
    'node_modules/(?!(@react-native|react-clone-referenced-element|@react-native-community|expo(nent)?|@expo(nent)?/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|@rneui/base|@rneui/themed|react-native-reanimated|expo-file-system|expo-sqlite|expo)/)'
  ],
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/.expo/'],
  moduleNameMapper: {
    '^react-native/Libraries/Utilities/codegenNativeCommands$': '<rootDir>/__mocks__/react-native/index.js',
    '^react-native-maps$': '<rootDir>/src/utils/mapFallback.js',
    '^react-native-maps/(.*)$': '<rootDir>/src/utils/mapFallback.js',
    '^expo-background-fetch$': '<rootDir>/__mocks__/expo-background-fetch.js',
    '^expo-task-manager$': '<rootDir>/__mocks__/expo-task-manager.js',
    '^expo-file-system/legacy$': '<rootDir>/__mocks__/expo-file-system.js',
    '^expo$': '<rootDir>/__mocks__/expo.js'
  }
};