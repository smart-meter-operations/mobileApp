# Smart Meter Operations - Usage Guide

This guide explains how to use the key features of the Smart Meter Operations application, including the new data synchronization capabilities.

## Table of Contents
1. [Authentication](#authentication)
2. [Dashboard](#dashboard)
3. [Data Synchronization](#data-synchronization)
4. [Map Features](#map-features)
5. [Capture Features](#capture-features)

## Authentication

The application uses a multi-layered authentication system:

1. **Phone Number Entry**: Enter your registered phone number on the login screen
2. **OTP Verification**: Receive and enter the SMS verification code
3. **Biometric/PIN Unlock**: Use fingerprint, face recognition, or PIN for subsequent access

### Biometric Setup
- The app will automatically detect available biometric hardware
- Follow on-screen prompts to enroll your biometric data
- Set up a fallback PIN/Pattern for when biometrics are unavailable

## Dashboard

The dashboard provides an overview of your tasks and operations:

### Stats Cards
- **Survey Tasks**: View total, completed, and pending survey tasks
- **Installation Tasks**: View total, completed, and pending installation tasks

### Installation List
- View all assigned installation tasks
- Tap on any task to view its location on the map
- Status indicators show task progress

### Navigation
- Use the bottom navigation bar to switch between features:
  - Home (Dashboard)
  - Task management
  - Map view
  - Messaging
  - Capture functionality

## Data Synchronization

The application features comprehensive offline-first data synchronization:

### How It Works
1. All data is stored locally in a SQLite database
2. Changes are automatically queued for synchronization
3. Data syncs automatically every 15 minutes when online
4. Background synchronization continues even when the app is not active

### Manual Sync
To manually trigger synchronization:
1. Open the Dashboard screen
2. Tap the "Sync Now" button
3. Wait for the synchronization to complete
4. A notification will confirm successful sync

### Sync Status
- The user avatar in the header shows your current sync status:
  - Green dot: Online and synced
  - Yellow dot: Syncing in progress
  - Red dot: Offline mode

### Benefits
- Work offline without interruption
- All data persists locally until synced
- Automatic conflict resolution
- Battery-efficient background processing

## Map Features

The map feature allows you to visualize consumer locations and navigate to them:

### Viewing Consumer Locations
1. From the Dashboard, tap on any consumer name in the installation list
2. The map will automatically center on that consumer's location
3. A red marker indicates the consumer's position
4. Your current location appears as a blue marker (if permissions granted)

### Navigation
1. After selecting a consumer location, tap the "Navigate" button
2. Your device's default maps application will open
3. Turn-by-turn directions will guide you to the consumer's address

### Map Controls
- Toggle visibility of infrastructure markers (Transformers, Poles, Feeders)
- Switch between standard and satellite map views
- Use pinch gestures to zoom in/out

## Capture Features

The capture feature allows you to document installations with photos and metadata:

### Taking Captures
1. Navigate to the Capture screen using the bottom navigation
2. The camera will automatically activate
3. Point the camera at the installation
4. Tap the capture button to take a photo

### Metadata Collection
Each capture automatically collects:
- GPS coordinates
- Network connection type and quality
- Timestamp
- Associated installation ID

### Offline Capability
- Captures are stored locally when offline
- All metadata is preserved
- Photos sync automatically when connectivity is restored

### Best Practices
- Ensure good lighting when taking photos
- Capture multiple angles if needed
- Verify GPS accuracy before capturing
- Check network status to understand sync timing

## Troubleshooting

### Common Issues

#### Camera Not Working
- Check that camera permissions are granted in device settings
- Restart the application
- Ensure no other apps are using the camera

#### Sync Not Working
- Verify internet connectivity
- Check that background app refresh is enabled
- Try manual sync using the "Sync Now" button

#### Biometric Authentication Fails
- Clean the fingerprint sensor or camera
- Re-enroll your biometric data
- Use the fallback PIN/Pattern

### Support
For additional help, contact your system administrator or refer to the documentation in the [docs](./docs) folder.