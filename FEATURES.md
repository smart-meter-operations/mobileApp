# New Features Documentation

## Consumer Location Mapping and Navigation

### Feature Overview
This feature allows users to view consumer locations on a map and navigate to them directly from the mobile app.

### How to Use

1. **Accessing Consumer Locations from Dashboard**
   - On the Dashboard screen, you will see a list of consumers in the installation table
   - Tap on any consumer name to automatically open the map with that consumer's location highlighted

2. **Viewing Consumer Location on Map**
   - When a consumer location is selected, the map will center on their address
   - A red marker will indicate the consumer's location
   - Your current location will be shown with a blue marker (if location permissions are granted)

3. **Navigating to Consumer Address**
   - Once a consumer location is displayed on the map, a "Navigate" button will appear at the bottom of the screen
   - Tap the "Navigate" button to open your device's default maps application with turn-by-turn directions
   - The navigation will start from your current location to the consumer's address

### Technical Implementation Details

- **Dashboard Integration**: The [DashboardScreen](file:///c%3A/Swapnil/Qoder%20Projects/SMOV0.1/src/screens/DashboardScreen.js#L15-L237) now passes consumer location data when a list item is pressed
- **Map Screen Enhancement**: The [MapScreen](file:///c%3A/Swapnil/Qoder%20Projects/SMOV0.1/src/screens/MapScreen.js#L58-L552) accepts route parameters for consumer locations and displays navigation options
- **Location Services**: Uses Expo Location API to get the user's current position
- **Navigation Integration**: Opens device's default maps application (Google Maps or Apple Maps) for turn-by-turn navigation
- **Web Compatibility**: Includes fallback UI for web platform where native maps are not supported

### Requirements
- Location permissions must be granted for full functionality
- Device must have a maps application installed (Google Maps, Apple Maps, etc.)

### Supported Map Types
- Standard map view
- Satellite view

### Map Controls
- Toggle visibility of infrastructure markers (Transformers, Poles, Feeders)
- Switch between map types
- Navigate to consumer location with one tap

### Platform Support
- **Mobile (iOS/Android)**: Full map functionality with interactive map view
- **Web**: Fallback UI that provides navigation options without interactive map

## Data Synchronization

### Feature Overview
The application now features comprehensive data synchronization capabilities that allow it to work seamlessly both online and offline. Data is stored locally in a SQLite database and automatically synchronized with a remote server when connectivity is available.

### How It Works

1. **Offline-First Architecture**
   - All data is stored locally in a SQLite database
   - Application functions fully offline with all features available
   - Changes are tracked and queued for synchronization

2. **Automatic Synchronization**
   - Data automatically synchronizes every 15 minutes when online
   - High-priority data (user profiles) syncs first
   - Background synchronization continues even when the app is not active

3. **Manual Synchronization**
   - Users can trigger immediate synchronization at any time
   - Force synchronization option to sync all pending data
   - Real-time feedback on synchronization progress

4. **Network Awareness**
   - Smart network detection prevents syncing on expensive connections
   - Automatic retry on failed synchronization attempts
   - Batch processing optimizes data transfer

### Data Models

- **Users**: User profile information with high sync priority
- **Installations**: Installation task data with medium sync priority
- **Captures**: Photo captures with metadata, synced with lower priority
- **Dashboard Stats**: Statistical data for reporting and analytics

### Technical Implementation Details

- **Database Service**: Manages local SQLite database operations
- **Sync Service**: Handles synchronization logic and scheduling
- **Network Service**: Monitors connectivity and network quality
- **Background Service**: Manages background synchronization tasks
- **Data Service**: Acts as intermediary between UI and data sources

### Configuration Options

The synchronization service can be configured with the following options:

```javascript
syncService.configure({
  autoSync: true,           // Enable/disable automatic sync
  syncIntervalMinutes: 15,  // Sync interval in minutes (default: 15)
  maxRetries: 3,            // Max retry attempts per item (default: 3)
  batchSize: 50             // Number of items to sync in one batch (default: 50)
});
```

### Benefits

1. **Uninterrupted Workflow**: Work continues regardless of network connectivity
2. **Data Safety**: All data is persisted locally before syncing
3. **Efficient Bandwidth**: Smart sync only transfers necessary data
4. **Battery Optimization**: Respects device power management
5. **User Control**: Manual sync options for immediate data transfer

### Error Handling

- **Network Failures**: Automatic retry with exponential backoff
- **API Errors**: Graceful handling of server-side issues
- **Data Conflicts**: Conflict detection and resolution mechanisms
- **User Feedback**: Clear error messages and sync status indicators

### Platform Support
- **Mobile (iOS/Android)**: Full synchronization capabilities
- **Web**: Synchronization works when browser has connectivity