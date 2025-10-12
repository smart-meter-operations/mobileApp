// Fallback for react-native-maps on web platform
// This is a mock implementation to prevent build errors on web

const MapView = () => null;
const Marker = () => null;
const PROVIDER_DEFAULT = 'google';

// Mock the codegenNativeCommands function that's causing the error
const codegenNativeCommands = () => ({});

export {
  MapView,
  Marker,
  PROVIDER_DEFAULT,
  codegenNativeCommands,
};

export default {
  MapView,
  Marker,
  PROVIDER_DEFAULT,
  codegenNativeCommands,
};