const { openDatabase } = require('expo-sqlite/legacy');

// This is a Node.js script to check the database schema
// In a real React Native app, you would use:
// import * as SQLite from 'expo-sqlite';

async function checkSchema() {
  try {
    // In React Native, you would use:
    // const db = await SQLite.openDatabaseAsync('smov_offline.db');
    
    console.log('This script is meant to be run in the React Native environment');
    console.log('To check the schema, you would run this code in the app:');
    console.log(`
      import * as SQLite from 'expo-sqlite';
      
      async function checkConsumerIndexingSchema() {
        try {
          const db = await SQLite.openDatabaseAsync('smov_offline.db');
          
          // Check all columns in consumer_indexing table
          const columns = await db.getAllAsync("PRAGMA table_info(consumer_indexing)");
          console.log('consumer_indexing table columns:');
          columns.forEach(column => {
            console.log(\`- \${column.name} (\${column.type})\`);
          });
          
          // Check if actualUserType column exists
          const hasActualUserType = columns.some(column => column.name === 'actualUserType');
          console.log('Has actualUserType column:', hasActualUserType);
          
          db.close();
        } catch (error) {
          console.error('Error checking schema:', error);
        }
      }
    `);
  } catch (error) {
    console.error('Error:', error);
  }
}

checkSchema();