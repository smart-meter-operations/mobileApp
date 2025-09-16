module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // This must be listed last according to Reanimated docs
      'react-native-reanimated/plugin',
    ],
  };
};