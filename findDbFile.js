// Script to find the database file on Windows
// Run this from command line: node findDbFile.js

const fs = require('fs');
const path = require('path');

console.log('=== DATABASE FILE LOCATOR ===');
console.log('Searching for smov_offline.db on Windows system...\n');

// Get Windows environment variables
const localAppData = process.env.LOCALAPPDATA;
const userProfile = process.env.USERPROFILE;
const appData = process.env.APPDATA;

console.log('Environment variables:');
console.log(`LOCALAPPDATA: ${localAppData || 'Not set'}`);
console.log(`USERPROFILE: ${userProfile || 'Not set'}`);
console.log(`APPDATA: ${appData || 'Not set'}\n`);

// List of possible locations to check
const locationsToCheck = [
  localAppData ? path.join(localAppData, 'Exponent') : null,
  userProfile ? path.join(userProfile, 'AppData', 'Local', 'Exponent') : null,
  appData ? path.join(appData, 'Exponent') : null,
  path.join(__dirname, '.expo'),
  path.join(userProfile || '', 'AppData', 'Local', 'Exponent'),
  path.join(userProfile || '', 'AppData', 'Roaming', 'Exponent'),
  'c:\\Users\\Public\\Documents\\Exponent'
].filter(Boolean); // Remove null values

// Function to search for database file recursively
function searchForDatabase(dir, fileName) {
  try {
    if (!fs.existsSync(dir)) {
      return null;
    }
    
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      try {
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
          // Skip node_modules and other large directories
          if (file !== 'node_modules' && file !== '.git' && file !== '__pycache__') {
            const result = searchForDatabase(filePath, fileName);
            if (result) {
              return result;
            }
          }
        } else if (file === fileName) {
          return filePath;
        }
      } catch (statError) {
        // Ignore errors for individual files/directories
        continue;
      }
    }
  } catch (error) {
    // Ignore errors for inaccessible directories
  }
  
  return null;
}

// Search in each location
console.log('Checking possible locations:\n');

let found = false;
for (const location of locationsToCheck) {
  console.log(`Searching in: ${location}`);
  
  try {
    if (fs.existsSync(location)) {
      console.log(`  Directory exists, searching...`);
      
      // Look for SQLite directory first
      const sqlitePath = path.join(location, 'SQLite');
      if (fs.existsSync(sqlitePath)) {
        const dbFile = path.join(sqlitePath, 'smov_offline.db');
        if (fs.existsSync(dbFile)) {
          console.log(`✓ FOUND: ${dbFile}\n`);
          found = true;
        } else {
          console.log(`  SQLite directory exists but database file not found`);
        }
      }
      
      // Also search recursively
      const foundFile = searchForDatabase(location, 'smov_offline.db');
      if (foundFile) {
        console.log(`✓ FOUND (recursive search): ${foundFile}\n`);
        found = true;
      }
      
      if (!fs.existsSync(sqlitePath) && !foundFile) {
        console.log(`  No database file found in this location`);
      }
    } else {
      console.log(`  Directory does not exist\n`);
    }
  } catch (error) {
    console.log(`  Error accessing directory: ${error.message}\n`);
  }
}

if (!found) {
  console.log('Database file not found in common locations.');
  console.log('\nIMPORTANT NOTES:');
  console.log('1. The .expo directory is created when you run the Expo app');
  console.log('2. Run your app first using "npm start" or "expo start"');
  console.log('3. After running the app, try this script again');
  console.log('4. If using Expo Go, the database might be in a device-specific folder\n');
}

console.log('=== SEARCH COMPLETE ===');