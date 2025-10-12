// Mock implementation of codegenNativeCommands for web platform
// This prevents the "Importing native-only module" error

const codegenNativeCommands = () => {
  return {};
};

module.exports = codegenNativeCommands;