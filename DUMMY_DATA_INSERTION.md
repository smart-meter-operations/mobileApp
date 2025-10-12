# Database Location Information

## Understanding Database Paths in Expo Applications

In Expo applications, the database files are stored within a sandboxed filesystem for security reasons. The exact location depends on the platform:

### Expo Filesystem Path
The database is accessible via Expo's filesystem API at:
```
${FileSystem.documentDirectory}SQLite/smov_offline.db
```

### Actual System Paths (Development)

#### Windows Development Environment:
- The database is typically located within your project's `.expo` directory
- Exact path: `c:\Swapnil\Qoder Projects\SMOV0.1\.expo\[device_info]\SQLite\smov_offline.db`
- Or in Expo Go app data: `%LOCALAPPDATA%\Exponent\`
- Or in Expo Go app data: `%USERPROFILE%\AppData\Local\Exponent\`

#### Android (Emulator/Device):
- Emulator: `/data/user/0/host.exp.exponent/files/.../SQLite/smov_offline.db`
- Physical device: `/data/user/0/[app_package]/files/.../SQLite/smov_offline.db`

#### iOS (Simulator/Device):
- Simulator: `~/Library/Developer/CoreSimulator/Devices/.../Documents/.../SQLite/smov_offline.db`
- Physical device: Within the app sandbox (not directly accessible)

### How to Find Your Database File on Windows

1. **Using the App (Recommended)**:
   - Run the app
   - Go to Master Data screen
   - Tap "Windows DB Location" button
   - Check the console logs for specific paths to search

2. **Using the Find Script**:
   - A script `findDbFile.js` has been created in your project root
   - Run it from command line: `node findDbFile.js`
   - It will search common locations and report if the database file is found

3. **Manual Search**:
   - Open File Explorer
   - Navigate to these locations:
     - `c:\Users\[YourUsername]\AppData\Local\Exponent\`
     - `c:\Swapnil\Qoder Projects\SMOV0.1\.expo\`
   - Look for subdirectories containing a "SQLite" folder
   - The database file is named "smov_offline.db"

4. **Using Command Line**:
   ```cmd
   cd %LOCALAPPDATA%\Exponent\
   dir /s smov_offline.db
   
   # Or from your project directory:
   cd c:\Swapnil\Qoder Projects\SMOV0.1\.expo\
   dir /s smov_offline.db
   ```

### Specific Windows Paths for This Project

Based on your project setup, check these specific locations:

1. **Expo Go App Data**:
   - `c:\Users\[YourUsername]\AppData\Local\Exponent\`
   - Look for subdirectories with device identifiers
   - Check for `SQLite\smov_offline.db` within those directories

2. **Project-Specific Data**:
   - `c:\Swapnil\Qoder Projects\SMOV0.1\.expo\`
   - This folder contains device-specific data when using Expo Go

3. **Environment Variable Locations**:
   - `%LOCALAPPDATA%\Exponent\`
   - `%USERPROFILE%\AppData\Local\Exponent\`

### How to Run the Database Finder Script

A Node.js script has been created to automatically search for your database file:

1. Open Command Prompt or PowerShell
2. Navigate to your project directory:
   ```cmd
   cd c:\Swapnil\Qoder Projects\SMOV0.1
   ```
3. Run the script:
   ```cmd
   node findDbFile.js
   ```
4. The script will search common locations and report if it finds the database file

### Important Notes

- The Expo filesystem path is a virtual path that maps to the actual file system location
- In production builds, the database is strictly sandboxed and not directly accessible
- For development purposes, you can access the database file for debugging
- Always use Expo's FileSystem APIs to interact with the database file rather than direct file system access
- The exact path depends on which device/emulator you are using with Expo Go

## Database Utility Functions

The application includes utility functions to help with database file management:

1. `getDatabaseInfo()` - Get detailed information about the database file
2. `exportDatabase()` - Export the database to a different location
3. `checkDatabaseContents()` - Check the contents of database tables
4. `clearDatabase()` - Clear all data from the consumerMaster table

These functions can be accessed through the Master Data screen in the application.

## Tips for Database File Access

1. **Enable Hidden Items**: In File Explorer, enable "Hidden items" to see AppData folders
2. **Search Feature**: Use Windows search to look for "smov_offline.db"
3. **Command Line**: Use `dir /s smov_offline.db` from likely locations
4. **Check Multiple Locations**: The database might be in different locations depending on how you're running the app