# Smart Meter Operations (SMOV0.1) 

A comprehensive React Native mobile application for Smart Meter Operations featuring advanced authentication, real-time capture capabilities, and offline-first architecture.

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── AnimatedUserHeader.js # Animated collapsible user header
│   ├── AppHeader.js     # App header with logo
│   ├── Button.js        # Button components (primary, secondary, animated)
│   ├── Card.js          # Card components (basic, stats card)
│   ├── Footer.js        # App footer
│   ├── Input.js         # Input components
│   ├── List.js          # List and ListItem components
│   ├── OTPInput.js      # OTP input component
│   ├── BottomNavigation.js  # Bottom navigation tabs
│   └── index.js         # Export all components
├── constants/           # App constants and configuration
│   └── index.js         # Colors, typography, spacing, API config
├── hooks/               # Custom React hooks
│   ├── useAnimations.js # Animation hooks
│   ├── useCommon.js     # Common utility hooks
│   └── index.js         # Export all hooks
├── screens/             # Screen components
│   ├── LoginScreen.js   # Phone number entry with Firebase SMS
│   ├── OTPScreen.js     # Firebase OTP verification
│   ├── PhoneUnlockScreen.js # Biometric/PIN authentication
│   ├── SuccessScreen.js # Success confirmation
│   ├── DashboardScreen.js # Main dashboard with animated header
│   ├── CaptureScreen.js # Camera capture with GPS & network detection
│   ├── MapScreen.js     # GIS map with infrastructure visualization
│   ├── UserProfileScreen.js # User profile with sync stats
│   └── index.js         # Export all screens
├── services/            # API and data services
│   ├── apiService.js    # HTTP client and API calls
│   ├── dataService.js   # Mock data and data operations
│   ├── firebaseService.js # Firebase SMS authentication
│   ├── phoneUnlockService.js # Biometric authentication service
│   ├── permissionsService.js # Device permissions management
│   ├── networkService.js # Network detection & bandwidth testing
│   ├── databaseService.js # SQLite offline database operations
│   ├── smsService.js    # SMS/OTP service (legacy)
│   └── index.js         # Export all services
├── styles/              # Modular styling
│   ├── commonStyles.js  # Common/shared styles
│   ├── dashboardStyles.js # Dashboard-specific styles
│   └── index.js         # Export all styles
├── utils/               # Utility functions
│   └── index.js         # Validation, formatting, data utilities
└── index.js             # Main src export
```

## Key Features

### 🔐 Advanced Authentication System
- **Firebase SMS OTP**: Secure phone number verification with Firebase
- **Biometric Authentication**: Fingerprint, Face ID, and Iris authentication
- **Fallback Security**: PIN/Pattern unlock when biometrics unavailable
- **Enrollment Guidance**: Automatic detection and enrollment prompts

### 📸 Capture & Data Collection
- **Camera Integration**: High-quality photo capture with Expo Camera
- **GPS Coordinates**: Precise location data for each capture
- **Network Detection**: Real-time bandwidth and connection quality analysis
- **Metadata Storage**: Complete capture context saved with images

### 🗺️ GIS Map Visualization
- **Interactive Map**: OpenStreetMap integration with user location
- **Infrastructure Display**: Transformers, Poles, and Feeders visualization
- **Toggle Controls**: Show/hide different infrastructure types
- **Custom Icons**: Relevant icons for each infrastructure type

### 🗄️ Offline-First Architecture
- **SQLite Database**: Robust local data storage with sync capabilities
- **Offline Operations**: Full functionality without internet connectivity
- **Data Synchronization**: Intelligent sync when connection available
- **Queue Management**: Background sync queue for pending operations

### 🎨 Modern UI/UX Design
- **Animated User Header**: Auto-collapsing header with smooth transitions
- **Sync Status Indicator**: Real-time connection and sync status
- **Safe Area Support**: Proper handling of device notches and status bars
- **Interactive Feedback**: Touch animations and visual feedback

### 🔧 Service Layer Architecture
- **Modular Services**: Authentication, Database, Network, Permissions
- **Error Handling**: Comprehensive error management and user feedback
- **Permission Management**: Automatic camera and location permission handling
- **Network Monitoring**: Real-time connection status and quality detection

### 🧩 Component Library
- **Reusable Components**: Button, Input, Card, List, AnimatedUserHeader
- **Consistent API**: Props-based customization across all components
- **Animation Support**: Built-in smooth animations and transitions
- **Safe Color System**: Fallback color system preventing undefined references

### 🎭 Custom Hooks
- **Animation Hooks**: Entrance, stagger, scale, bounce animations
- **Utility Hooks**: Keyboard detection, async operations, form validation
- **State Management**: Simplified state management patterns
- **Safe Area Hooks**: Dynamic safe area handling for all devices

### 📱 Screen Architecture
- **Clean Structure**: Separation of concerns with service integration
- **Progressive Enhancement**: Graceful degradation when features unavailable
- **Animation Integration**: Smooth transitions and micro-interactions
- **Responsive Design**: Adaptive layouts for different screen sizes

## Authentication & Security

### Firebase Configuration
```javascript
// src/services/firebaseService.js
// Update with your Firebase project credentials
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  // ... other config
};
```

### Biometric Authentication Setup
```javascript
// Automatic biometric detection and fallback
const authResult = await PhoneUnlockService.authenticate({
  promptMessage: 'Unlock to access SMOV',
  fallbackLabel: 'Use PIN/Pattern',
  disableDeviceFallback: false
});
```

### Database Operations
```javascript
// Initialize database before use
await DatabaseService.initialize();

// Save capture data
const captureData = {
  installation_id: installationId,
  image_path: permanentUri,
  latitude: location.latitude,
  longitude: location.longitude,
  network_type: network.connection.type,
  signal_strength: JSON.stringify(network.signal)
};
const result = await DatabaseService.saveCapture(captureData);
```

### API Integration Guide

### Current State (Offline-First)
```javascript
// Local database operations
const installations = await DatabaseService.getInstallations();
const captures = await DatabaseService.getCaptures();
```

### Future State (API Sync)
```javascript
// API sync when online
const syncResult = await ApiService.syncPendingData();
if (syncResult.success) {
  await DatabaseService.markAsSynced(syncResult.syncedIds);
}
```

### Migration Steps
1. **Backend Setup**: Set up your Node.js/Django/Laravel backend
2. **Update API_CONFIG**: Change `baseUrl` in `src/constants/index.js`
3. **Implement Sync Logic**: Add API calls to sync local data
4. **Token Management**: Integrate Firebase auth tokens with API calls

## Map Feature Configuration

### OpenStreetMap Integration

The map feature now uses OpenStreetMap instead of Google Maps, which means:

1. **No API Keys Required**: OpenStreetMap is free and doesn't require API keys
2. **Privacy Friendly**: No data is sent to Google
3. **Community Driven**: Map data is maintained by the OpenStreetMap community

### Map Screen Features
- User location tracking
- Infrastructure markers (Transformers, Poles, Feeders)
- Toggle visibility for each infrastructure type
- Custom icons for different infrastructure types
- Error handling and fallback UI
- Map type switching (OSM/None)

## Capture Feature Usage

### Camera Capture with Metadata
```javascript
// Navigate to capture screen
navigation.navigate('CaptureScreen', { 
  installationId: 'inst_123' 
});

// Capture process automatically:
// 1. Requests camera and location permissions
// 2. Captures high-quality photo
// 3. Records GPS coordinates
// 4. Detects network quality and bandwidth
// 5. Saves to SQLite database
// 6. Stores image in device filesystem
```

### Network Detection
```javascript
// Get comprehensive network information
const networkInfo = await NetworkService.getCaptureNetworkInfo();
console.log(networkInfo);
// {
//   connection: { type: 'wifi', isConnected: true },
//   signal: { quality: 'excellent', strength: -45 },
//   speed: { downloadSpeed: 25.6, quality: 'good' }
// }
```

## Adding New Screens

### 1. Create Screen Component
```javascript
// src/screens/NewScreen.js
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, SafeAreaView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppHeader, Button } from '../components';
import { COLORS, SPACING } from '../constants';

export default function NewScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  
  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <AppHeader />
      <View style={styles.content}>
        <Text style={styles.title}>New Screen</Text>
        {/* Your content */}
      </View>
    </SafeAreaView>
  );
}
```

### 2. Add to Navigation
```javascript
// App.js
import { NewScreen } from './src/screens';
import { SCREENS } from './src/constants';

// Add to SCREENS constant
export const SCREENS = {
  // ... existing screens
  NEW_SCREEN: 'NewScreen',
};

// Add to Stack.Navigator
<Stack.Screen name={SCREENS.NEW_SCREEN} component={NewScreen} />
```

### 3. Export Screen
```javascript
// src/screens/index.js
export { default as NewScreen } from './NewScreen';
```

## Styling Guide

### Using Design System
```javascript
import { COLORS, TYPOGRAPHY, SPACING } from '../constants';

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.background,
    padding: SPACING.lg,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSizes['2xl'],
    fontWeight: TYPOGRAPHY.fontWeights.bold,
    color: COLORS.textPrimary,
  },
});
```

### Extending Common Styles
```javascript
import { layoutStyles, buttonStyles } from '../styles';

// Use as base and extend
const customStyles = StyleSheet.create({
  customButton: {
    ...buttonStyles.primaryButton,
    borderRadius: 20, // Override specific properties
  },
});
```

## Component Usage

### Button Component
```javascript
import { Button } from '../components';

<Button 
  title="Submit" 
  onPress={handleSubmit}
  loading={isLoading}
  variant="primary" // or "secondary"
/>
```

### Card Component
```javascript
import { Card, StatsCard } from '../components';

<Card onPress={handlePress}>
  <Text>Card Content</Text>
</Card>

<StatsCard
  title="TASKS"
  icon="📋"
  number={12}
  label="Total"
  details={[
    { label: 'Completed', count: 8, color: COLORS.success },
    { label: 'Pending', count: 4, color: COLORS.error },
  ]}
/>
```

### List Component
```javascript
import { List } from '../components';

<List
  data={items}
  onItemPress={handleItemPress}
  showStatus={true}
  emptyMessage="No items available"
/>
```

## Animation Usage

### Built-in Animations
```javascript
import { useEntranceAnimation, useStaggeredAnimation } from '../hooks';

function MyScreen() {
  const { animatedStyle } = useEntranceAnimation();
  const cardAnims = useStaggeredAnimation(3, 200);

  return (
    <Animated.View style={animatedStyle}>
      {/* Content with entrance animation */}
    </Animated.View>
  );
}
```

### Animated User Header
```javascript
import { AnimatedUserHeader } from '../components';

<AnimatedUserHeader
  user={{
    name: 'Rajesh',
    role: 'Surveyor / Installer',
    avatar: '👨‍💼'
  }}
  onUserIconPress={() => navigation.navigate('UserProfileScreen')}
  syncStatus='online' // 'online', 'syncing', 'offline'
/>
```

### Interactive Touch Effects
```javascript
// All interactive elements include visual feedback
<TouchableOpacity
  style={styles.card}
  onPress={handlePress}
  activeOpacity={0.95} // Scale animation on press
>
  <Text>Interactive Card</Text>
</TouchableOpacity>
```

## Permission Management

### Automatic Permission Handling
```javascript
// Camera and location permissions automatically requested
const permissions = await PermissionsService.checkCapturePermissions();
if (!permissions.allGranted) {
  PermissionsService.handleCapturePermissions(
    () => console.log('Permissions granted'),
    (error) => console.log('Permissions denied:', error)
  );
}
```

### Database Management

### SQLite Operations
```javascript
// Initialize database (required before any operations)
await DatabaseService.initialize();

// Save installation data
const installation = {
  customer_name: 'John Doe',
  address: '123 Main Street',
  meter_number: 'MTR001',
  status: 'pending'
};
const result = await DatabaseService.saveInstallation(installation);

// Get sync statistics
const stats = {
  installations: await DatabaseService.getTableCount('installations'),
  captures: await DatabaseService.getTableCount('captures'),
  pendingSync: await DatabaseService.getSyncQueue()
};
```

### Data Synchronization
```javascript
// Check sync status
const syncQueue = await DatabaseService.getSyncQueue();
if (syncQueue.length > 0) {
  // API sync implementation here
  console.log(`${syncQueue.length} items pending sync`);
}

// Clear all local data (with confirmation)
Await DatabaseService.clearAllData();
```

## Development Guidelines

### Adding New Constants
```javascript
// src/constants/index.js
export const NEW_CONSTANT = {
  VALUE1: 'value1',
  VALUE2: 'value2',
};
```

### Creating Utility Functions
```javascript
// src/utils/index.js
export const newUtilityFunction = (input) => {
  // Implementation
  return result;
};
```

### Custom Hooks
```javascript
// src/hooks/useCustomHook.js
import { useState, useEffect } from 'react';

export const useCustomHook = () => {
  const [state, setState] = useState(null);
  
  // Hook logic
  
  return { state, setState };
};
```

## Technical Specifications

### Dependencies
```json
{
  "expo": "~53.0.0",
  "react": "19.0.0",
  "react-native": "0.79.5",
  "firebase": "^10.13.0",
  "expo-camera": "~16.0.0",
  "expo-location": "~18.0.2",
  "expo-local-authentication": "~15.0.2",
  "expo-sqlite": "~15.0.3",
  "react-native-safe-area-context": "^5.6.1",
  "@react-native-community/netinfo": "^11.4.1"
}
```

### Device Requirements
- **iOS**: 13.0+ for biometric authentication
- **Android**: API 23+ (Android 6.0) for biometric support
- **Permissions**: Camera, Location, Biometric access
- **Storage**: SQLite database for offline operations

## Development Setup

### Prerequisites
```bash
# Install Expo CLI
npm install -g @expo/cli

# Install dependencies
npm install

# Start development server
npm start
```

### Firebase Setup
1. Create Firebase project at https://console.firebase.google.com
2. Enable Authentication > Sign-in method > Phone
3. Update `firebaseConfig` in `src/services/firebaseService.js`
4. Add your app's bundle ID to Firebase project

## Future Enhancements

### Completed Features ✅
1. **✅ Authentication**: Firebase SMS OTP + Biometric unlock
2. **✅ Offline Support**: SQLite database with sync capabilities
3. **✅ Camera Integration**: Photo capture with GPS and network metadata
4. **✅ Real-time Monitoring**: Network quality and sync status indicators
5. **✅ Modern UI**: Animated components and safe area handling

### Planned Features 🚧
1. **API Integration**: Backend synchronization service
2. **Push Notifications**: Real-time task updates
3. **Maps Integration**: Interactive location-based features
4. **Advanced Reporting**: Analytics dashboard and export features
5. **Bulk Operations**: Mass data import/export capabilities

### Scalability Considerations
- **Performance**: React.memo and useMemo optimizations implemented
- **Error Handling**: Comprehensive error boundaries and user feedback
- **Testing**: Unit test framework ready for implementation
- **Security**: Biometric authentication and secure data storage
- **Offline-First**: Full functionality without internet connectivity

## Troubleshooting

### Common Issues

#### Camera Permissions
```javascript
// If camera doesn't work, check permissions
const cameraPermission = await Camera.requestCameraPermissionsAsync();
if (cameraPermission.status !== 'granted') {
  Alert.alert('Camera access required');
}
```

#### Database Errors
```javascript
// Always initialize database before queries
await DatabaseService.initialize();
// Prevents: "Cannot read property 'getFirstAsync' of null"
```

#### Biometric Authentication Issues
```javascript
// Check if biometric hardware is available
const biometricInfo = await PhoneUnlockService.getAuthenticationInfo();
if (!biometricInfo.biometricSupport.hasHardware) {
  // Fallback to PIN/Pattern
}
```

### Color System Safety
```javascript
// Use SAFE_COLORS to prevent undefined references
const SAFE_COLORS = {
  primary: '#3b82f6',
  background: '#f8fafc',
  // ... fallback colors
  ...COLORS // Spread existing colors
};
```

## Code Review Tools

This project is configured with several code review tools to ensure code quality and consistency:

### 1. ESLint (Static Code Analysis)
ESLint is configured to analyze JavaScript/React Native code for potential errors, style issues, and best practices.

### 2. Prettier (Code Formatting)
Prettier is configured to automatically format code according to consistent style guidelines.

### 3. Jest (Testing)
Jest is configured for unit testing JavaScript functions and components.

### 4. SonarQube Scanner (Static Code Analysis)
SonarQube Scanner provides comprehensive static analysis for code quality, security, and maintainability.

For detailed information about these tools and how to use them, see [CODE_REVIEW_TOOLS.md](CODE_REVIEW_TOOLS.md).

## Contributing

### Development Guidelines
1. **Follow React Import Standard**: Use single clean React import
2. **Use Safe Area Context**: Proper handling of device notches
3. **Initialize Database**: Always call `DatabaseService.initialize()` first
4. **Handle Permissions**: Check and request permissions before using features
5. **Interactive Feedback**: Add touch animations to all interactive elements
6. **Color Safety**: Use SAFE_COLORS for fallback color handling

### Code Standards
```javascript
// ✅ Correct React import
import React, { useEffect, useRef, useState } from 'react';

// ✅ Safe area handling
const insets = useSafeAreaInsets();
<SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>

// ✅ Interactive feedback
<TouchableOpacity activeOpacity={0.95} onPress={handlePress}>

// ✅ Database initialization
await DatabaseService.initialize();
const data = await DatabaseService.getData();
```

## License

Private - Smart Meter Operations Application v0.1
Developed for Smart Meter Operations with advanced authentication and capture capabilities.