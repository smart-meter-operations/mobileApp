import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

/**
 * Utility to help locate the database file on the actual file system
 * This is particularly useful for development environments
 */

/**
 * Get information about where the database might be located on the actual file system
 * @returns {Promise<Object>} Information about possible database locations
 */
export const findDatabaseFile = async () => {
  const expoPath = `${FileSystem.documentDirectory}SQLite/smov_offline.db`;
  const fileInfo = await FileSystem.getInfoAsync(expoPath);
  
  const result = {
    expoPath: expoPath,
    fileInfo: fileInfo,
    possibleLocations: [],
    platform: Platform.OS
  };
  
  // Add platform-specific possible locations
  if (Platform.OS === 'android') {
    result.possibleLocations = [
      'In Android emulator: /data/user/0/host.exp.exponent/files/.../SQLite/smov_offline.db',
      'On physical device: /data/user/0/[app_package]/files/.../SQLite/smov_offline.db'
    ];
  } else if (Platform.OS === 'ios') {
    result.possibleLocations = [
      'In iOS simulator: ~/Library/Developer/CoreSimulator/Devices/.../Documents/.../SQLite/smov_offline.db',
      'On physical device: Within the app sandbox'
    ];
  } else {
    // For web/Windows development
    result.possibleLocations = [
      'In Expo development on Windows, check these locations:',
      `1. Project directory: c:\\Swapnil\\Qoder Projects\\SMOV0.1\\.expo\\devices\\...\\SQLite\\smov_offline.db`,
      `2. Expo Go data: %LOCALAPPDATA%\\Exponent\\`,
      `3. Expo Go data: %USERPROFILE%\\AppData\\Local\\Exponent\\`,
      'The exact path depends on which device/emulator you are using with Expo Go'
    ];
  }
  
  // Try to get the actual file system path if possible
  try {
    // On Windows development, we might be able to get more specific information
    if (typeof process !== 'undefined' && process.platform === 'win32') {
      result.systemPlatform = 'Windows';
      result.notes = [
        'In Windows Expo development, the database is sandboxed within Expo Go app data',
        'Look in: %LOCALAPPDATA%\\Exponent\\ or %USERPROFILE%\\AppData\\Local\\Exponent\\',
        'The expoPath above is the path Expo uses internally',
        'Actual file location: Check subdirectories under the Exponent data folder'
      ];
      
      // Try to provide more specific Windows paths
      try {
        const localAppData = process.env.LOCALAPPDATA || '';
        const userProfile = process.env.USERPROFILE || '';
        
        if (localAppData) {
          result.notes.push(`Expo Go data location: ${localAppData}\\Exponent\\`);
        }
        
        if (userProfile) {
          result.notes.push(`Alternative location: ${userProfile}\\AppData\\Local\\Exponent\\`);
        }
      } catch (envError) {
        // Ignore environment variable errors
      }
    }
  } catch (error) {
    // Ignore errors in getting system platform
  }
  
  return result;
};

/**
 * Try to find the actual database file on Windows development environment
 * @returns {Promise<Object>} Detailed information about the database file location
 */
export const findWindowsDatabaseFile = async () => {
  const expoPath = `${FileSystem.documentDirectory}SQLite/smov_offline.db`;
  const fileInfo = await FileSystem.getInfoAsync(expoPath);
  
  const result = {
    expoPath: expoPath,
    fileInfo: fileInfo,
    platform: Platform.OS,
    systemPlatform: 'Windows',
    possibleActualPaths: [],
    searchLocations: []
  };
  
  // For Windows development with Expo, the database is typically in these locations:
  result.searchLocations = [
    '%LOCALAPPDATA%\\Exponent\\',
    '%USERPROFILE%\\AppData\\Local\\Exponent\\',
    'c:\\Users\\[YourUsername]\\AppData\\Local\\Exponent\\',
    'Your project .expo directory'
  ];
  
  // Try to get actual environment variables
  try {
    if (typeof process !== 'undefined' && process.platform === 'win32') {
      const localAppData = process.env.LOCALAPPDATA || '';
      const userProfile = process.env.USERPROFILE || '';
      const appData = process.env.APPDATA || '';
      
      if (localAppData) {
        result.possibleActualPaths.push(`${localAppData}\\Exponent\\`);
      }
      
      if (userProfile) {
        result.possibleActualPaths.push(`${userProfile}\\AppData\\Local\\Exponent\\`);
      }
      
      if (appData) {
        result.possibleActualPaths.push(`${appData}\\Exponent\\`);
      }
      
      // Add project-specific location
      result.possibleActualPaths.push('c:\\Swapnil\\Qoder Projects\\SMOV0.1\\.expo\\');
    }
  } catch (error) {
    console.log('Could not access environment variables');
  }
  
  return result;
};

export default {
  findDatabaseFile,
  findWindowsDatabaseFile
};