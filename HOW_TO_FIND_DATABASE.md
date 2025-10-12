# How to Find the Database File on Windows

## Important Note
The database file (`smov_offline.db`) is only created after you run the application at least once. The file does not exist until the app initializes the database.

## Steps to Find the Database File

### 1. Run the Application First
Before searching for the database file, you need to run the app to create the database:

```bash
# Navigate to your project directory
cd c:\Swapnil\Qoder Projects\SMOV0.1

# Install dependencies (if not already done)
npm install

# Run the application
npm start
```

### 2. Use Expo Go to Access the App
- Install Expo Go on your mobile device
- Scan the QR code shown in the terminal
- Open the app and navigate to the Master Data screen
- Tap any of the database-related buttons (like "Show Database Path")
- This will initialize the database

### 3. Search for the Database File

After running the app, use one of these methods:

#### Method A: Use the Automated Script
```bash
# From your project directory
node findDbFile.js
```

#### Method B: Manual Search
1. Open File Explorer
2. Enable "Hidden items" in the View tab
3. Navigate to these locations:
   - `%LOCALAPPDATA%\Exponent\`
   - `c:\Swapnil\Qoder Projects\SMOV0.1\.expo\`
4. Look for subdirectories containing a "SQLite" folder
5. The database file is named "smov_offline.db"

#### Method C: Command Line Search
```cmd
# Search in the Expo Go data directory
cd %LOCALAPPDATA%\Exponent\
dir /s smov_offline.db

# Or search in your project directory
cd c:\Swapnil\Qoder Projects\SMOV0.1
dir /s smov_offline.db
```

### 4. Expected Database Locations After Running the App

Once you've run the app, the database should be located in one of these places:

1. **In your project directory** (most likely):
   ```
   c:\Swapnil\Qoder Projects\SMOV0.1\.expo\[device_id]\SQLite\smov_offline.db
   ```

2. **In Expo Go app data**:
   ```
   C:\Users\[YourUsername]\AppData\Local\Exponent\[device_id]\SQLite\smov_offline.db
   ```

## Tips for Success

1. **Run the app first**: The database file is only created when the app initializes
2. **Check the logs**: When you tap database buttons in the app, detailed path information is logged to the console
3. **Look for device-specific folders**: The database is often in a subfolder named with a device identifier
4. **Search recursively**: Use `dir /s smov_offline.db` to search all subdirectories

## Common Issues

1. **File not found**: Make sure you've run the app at least once
2. **Permission denied**: Run Command Prompt as Administrator if needed
3. **Hidden directories**: Enable "Hidden items" in File Explorer
4. **Multiple locations**: The database might be in different locations depending on how you run the app

## Using the Database File

Once you find the database file, you can:
1. Open it with a SQLite browser like DB Browser for SQLite
2. Backup the file by copying it to another location
3. Inspect the data directly for debugging purposes

Remember to always use the app's database utility functions for normal operations rather than direct file manipulation.