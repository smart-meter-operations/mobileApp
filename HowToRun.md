# How to Run the Smart Meter Operations (SMOV) Mobile App

This guide provides step-by-step instructions for setting up and running the Smart Meter Operations mobile application locally for testing with Expo Go.

## Prerequisites

Before you begin, ensure you have the following installed on your system:

1. **Node.js** (version 16 or higher)
2. **npm** (comes with Node.js) or **yarn**
3. **Git**
4. **Expo Go app** installed on your mobile device (available on iOS App Store and Google Play Store)

## Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/smart-meter-operations/mobileApp.git
cd mobileApp
```

### 2. Install Dependencies

```bash
npm install
```

Or if you're using yarn:

```bash
yarn install
```

### 3. Verify Installation

Check that all dependencies have been installed correctly:

```bash
npm list
```

## Running the Application

### Option 1: Using Expo CLI (Recommended)

1. Install Expo CLI globally (if not already installed):

```bash
npm install -g @expo/cli
```

2. Start the development server:

```bash
npm start
```

Or:

```bash
npx expo start
```

3. Scan the QR code with your Expo Go app

### Option 2: Platform-Specific Commands

#### For iOS:
```bash
npm run ios
```

#### For Android:
```bash
npm run android
```

#### For Web (if supported):
```bash
npm run web
```

## Building the Application

### Setting up EAS CLI for Building APK

1. Install EAS CLI globally:

```bash
npm install -g eas-cli
```

2. Log in to your Expo account:

```bash
eas login
```

3. Initialize EAS for your project:

```bash
eas init
```

4. Configure build settings in `eas.json`:

```json
{
  "cli": {
    "version": ">= 12.0.0",
    "appVersionSource": "remote"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "apk"
      }
    }
  }
}
```

5. Update `app.json` with Android package information:

```json
{
  "expo": {
    // ... other settings
    "android": {
      "package": "com.yourcompany.smartmeteroperations",
      "versionCode": 1
    }
    // ... other settings
  }
}
```

### Building Android APK

#### For Development:
```bash
eas build --platform android --profile development
```

#### For Preview:
```bash
eas build --platform android --profile preview
```

#### For Production:
```bash
eas build --platform android --profile production
```

You can also use npx if you haven't installed EAS CLI globally:

```bash
npx eas-cli build --platform android --profile preview
```

The build will be queued and you'll receive a link to download the APK once it's complete.

## Testing the Application

### Running Unit Tests

The project includes Jest for unit testing:

```bash
npm test
```

To run tests in watch mode:

```bash
npm test -- --watch
```

### Running Code Quality Checks

ESLint is configured for static code analysis:

```bash
npm run lint
```

To automatically fix issues:

```bash
npm run lint -- --fix
```

Prettier is configured for code formatting:

```bash
npm run format
```

Run all code quality checks:

```bash
npm run code-quality
```

## Firebase Configuration

To use the Firebase authentication features:

1. Create a Firebase project at https://console.firebase.google.com
2. Enable Authentication > Sign-in method > Phone
3. Update the `firebaseConfig` in `src/services/firebaseService.js` with your project credentials
4. Add your app's bundle ID to the Firebase project

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

## Troubleshooting

### Common Issues

1. **Metro Bundler Issues**
   - Clear cache: `npx expo start -c`
   - Reset Metro: `npm start -- --reset-cache`

2. **Dependency Issues**
   - Delete `node_modules` and `package-lock.json`
   - Run `npm install` again

3. **iOS Simulator Issues**
   - Ensure Xcode is installed (macOS only)
   - Run `npx expo run:ios`

4. **Android Emulator Issues**
   - Ensure Android Studio and emulator are installed
   - Run `npx expo run:android`

### Development Tips

1. **Hot Reload**: Changes to the code will automatically reload in the Expo Go app
2. **Debugging**: Shake your device to open developer menu in Expo Go
3. **Logs**: View console logs in the terminal where you ran `npm start`

## Code Review Tools

This project includes several code review tools:

1. **ESLint**: Static code analysis
2. **Prettier**: Code formatting
3. **Jest**: Unit testing
4. **SonarQube Scanner**: Comprehensive static analysis

For more details, see [CODE_REVIEW_TOOLS.md](CODE_REVIEW_TOOLS.md)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## Support

For issues or questions, please create an issue on the GitHub repository.