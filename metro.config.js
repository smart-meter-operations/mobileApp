const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Clear any existing cache when resolving modules
config.resetCache = true;

module.exports = config;