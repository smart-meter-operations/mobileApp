import * as FileSystem from 'expo-file-system/legacy';
import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';

/**
 * Utility functions for database operations
 */

/**
 * Get the full path to the database file
 * @returns {string} Full path to the database file
 */
export const getDatabasePath = () => {
  // This returns the path within the Expo filesystem sandbox
  return `${FileSystem.documentDirectory}SQLite/smov_offline.db`;
};

/**
 * Get detailed database path information including system-specific details
 * @returns {Promise<Object>} Detailed path information
 */
export const getDetailedDatabasePathInfo = async () => {
  const expoPath = getDatabasePath();
  
  // Get file info
  const fileInfo = await FileSystem.getInfoAsync(expoPath);
  
  // Create detailed path information
  const pathInfo = {
    expoPath: expoPath,
    platform: Platform.OS,
    fileInfo: fileInfo,
    systemContext: ''
  };
  
  // Add platform-specific context
  if (Platform.OS === 'android') {
    pathInfo.systemContext = 'Android app sandbox path';
  } else if (Platform.OS === 'ios') {
    pathInfo.systemContext = 'iOS app sandbox path';
  } else {
    pathInfo.systemContext = 'Expo development environment path';
  }
  
  // For Windows development, we can provide additional context
  if (Platform.OS === 'windows' || process.platform === 'win32') {
    pathInfo.systemContext = 'Windows development environment';
    // On Windows with Expo, the path is typically under the project directory
    // but we're still limited to the Expo filesystem sandbox
  }
  
  return pathInfo;
};

/**
 * Check if the database file exists
 * @returns {Promise<Object>} File info object
 */
export const checkDatabaseFile = async () => {
  const databasePath = getDatabasePath();
  return await FileSystem.getInfoAsync(databasePath);
};

/**
 * List all files in the SQLite directory
 * @returns {Promise<Array>} Array of file names
 */
export const listDatabaseFiles = async () => {
  const sqliteDir = `${FileSystem.documentDirectory}SQLite/`;
  const dirInfo = await FileSystem.getInfoAsync(sqliteDir);
  
  if (dirInfo.exists && dirInfo.isDirectory) {
    const files = await FileSystem.readDirectoryAsync(sqliteDir);
    return files;
  }
  
  return [];
};

/**
 * Get database information with enhanced path details
 * @returns {Promise<Object>} Database information
 */
export const getDatabaseInfo = async () => {
  const pathInfo = await getDetailedDatabasePathInfo();
  const fileInfo = pathInfo.fileInfo;
  
  // Log database information for debugging
  console.log('=== DATABASE FILE INFO ===');
  console.log('Platform:', pathInfo.platform);
  console.log('Expo filesystem path:', pathInfo.expoPath);
  console.log('System context:', pathInfo.systemContext);
  console.log('File exists:', fileInfo.exists);
  if (fileInfo.exists) {
    console.log('File size:', fileInfo.size, 'bytes');
    console.log('Is directory:', fileInfo.isDirectory);
    console.log('Last modified:', new Date(fileInfo.modificationTime).toISOString());
    
    // Try to provide more context about where this file is located on the system
    if (Platform.OS === 'android') {
      console.log('Note: This is the absolute path within the Android app sandbox');
      console.log('Full system path: /data/user/0/[app_id]/files/.../SQLite/smov_offline.db');
    } else if (Platform.OS === 'ios') {
      console.log('Note: This is the absolute path within the iOS app sandbox');
      console.log('On simulator: ~/Library/Developer/CoreSimulator/Devices/.../Documents/.../SQLite/smov_offline.db');
    } else {
      console.log('Note: This is the path within the Expo development environment');
      console.log('In development, this maps to your project directory structure');
    }
  }
  console.log('=========================');
  
  if (fileInfo.exists) {
    return {
      path: pathInfo.expoPath,
      exists: true,
      size: fileInfo.size,
      lastModified: new Date(fileInfo.modificationTime).toLocaleString(),
      isDirectory: fileInfo.isDirectory,
      platform: pathInfo.platform,
      systemContext: pathInfo.systemContext
    };
  } else {
    return {
      path: pathInfo.expoPath,
      exists: false,
      platform: pathInfo.platform,
      systemContext: pathInfo.systemContext
    };
  }
};

/**
 * Export database file (for backup purposes)
 * @param {string} destinationPath - Path to export the database to
 * @returns {Promise<boolean>} Success status
 */
export const exportDatabase = async (destinationPath) => {
  try {
    const databasePath = getDatabasePath();
    const fileInfo = await FileSystem.getInfoAsync(databasePath);
    
    if (!fileInfo.exists) {
      throw new Error('Database file does not exist');
    }
    
    await FileSystem.copyAsync({
      from: databasePath,
      to: destinationPath
    });
    
    return true;
  } catch (error) {
    console.error('Export database failed:', error);
    return false;
  }
};

export default {
  getDatabasePath,
  getDetailedDatabasePathInfo,
  checkDatabaseFile,
  listDatabaseFiles,
  getDatabaseInfo,
  exportDatabase
};