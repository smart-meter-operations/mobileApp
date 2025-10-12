const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Clear any existing cache when resolving modules
config.resetCache = true;

// Add custom resolver for web platform
config.resolver = {
  ...config.resolver,
  // Custom resolve function
  resolveRequest: (context, realModuleName, platform, moduleName) => {
    // Handle the specific problematic module
    if (platform === 'web' && realModuleName && 
        (realModuleName.includes('react-native/Libraries/Utilities/codegenNativeCommands') ||
         moduleName === 'react-native/Libraries/Utilities/codegenNativeCommands')) {
      // Return a simple mock module
      return {
        filePath: require.resolve('./src/utils/codegenNativeCommands.js'),
        type: 'sourceFile',
      };
    }
    
    // Handle react-native-maps and its submodules on web
    if (platform === 'web' && realModuleName && realModuleName.includes('react-native-maps')) {
      return {
        filePath: require.resolve('./src/utils/mapFallback.js'),
        type: 'sourceFile',
      };
    }
    
    // Use default resolver for other cases
    return context.resolveRequest(context, realModuleName, platform, moduleName);
  },
};

module.exports = config;