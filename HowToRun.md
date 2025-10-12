# How to Run the Smart Meter Operations App

## Prerequisites

- Node.js (version 18 or higher)
- npm or yarn
- Expo CLI
- Android Studio or Xcode for mobile development

## Installation

1. Clone the repository
2. Navigate to the project directory
3. Install dependencies:
   ```bash
   npm install
   ```

## Running the Application

### Development Mode

To start the development server:
```bash
npm start
```

This will start the Expo development server. You can then:
- Scan the QR code with the Expo Go app on your mobile device
- Press 'a' to run on Android emulator
- Press 'i' to run on iOS simulator

### Running on Specific Platforms

- Android: `npm run android`
- iOS: `npm run ios`
- Web: `npm run web`

## Database and Synchronization

The application uses a local SQLite database for offline functionality with automatic synchronization capabilities.

### Database Features

- Local SQLite database for offline data storage
- Automatic synchronization with remote server
- Data persistence across app sessions
- Conflict resolution mechanisms

### Synchronization

The app supports both on-demand and scheduled synchronization:

1. **On-demand sync**: Manually trigger synchronization through the app interface
2. **Scheduled sync**: Automatic synchronization every 15 minutes when online
3. **Background sync**: Continues to sync data even when the app is in the background

### Configuration

Sync settings can be configured in the app:
- Sync interval: 15 minutes (default)
- Batch size: 50 records per sync
- Max retries: 3 attempts per record

## Testing

To run tests:
```bash
npm test
```

## Code Quality

To run linting and formatting:
```bash
npm run code-quality
```

## Troubleshooting

Refer to the [TROUBLESHOOTING.md](TROUBLESHOOTING.md) file for common issues and solutions.

## Project Structure Overview

```
src/
├── components/          # Reusable UI components
├── constants/           # App constants and configuration
├── hooks/               # Custom React hooks
├── screens/             # Screen components
├── services/            # API and data services
├── styles/              # Modular styling
└── utils/               # Utility functions
```

## Key Features

1. **Authentication System**
   - Firebase SMS OTP verification
   - Biometric authentication (fingerprint, face ID)
   - PIN/Pattern fallback

2. **Dashboard**
   - Animated user header
   - Statistics cards
   - Data tables

3. **Capture Functionality**
   - Camera integration
   - GPS coordinates
   - Network detection

4. **Map Visualization**
   - OpenStreetMap integration
   - Infrastructure display

5. **Offline Support**
   - SQLite database
   - Data synchronization

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## Support

For issues or questions, please create an issue on the GitHub repository.