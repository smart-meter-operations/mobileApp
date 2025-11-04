module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          alias: {
            'react-native/Libraries/Utilities/codegenNativeCommands': './src/utils/codegenNativeCommands.js',
          },
        },
      ],
      // This must be listed last according to Reanimated docs
      'react-native-reanimated/plugin',
    ],
  };
};