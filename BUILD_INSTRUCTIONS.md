# APK Build Instructions for WATTLY Smart Meter Operations App

## Prerequisites
- Node.js installed
- Expo CLI installed
- EAS CLI installed (already done)
- Expo account (create at https://expo.dev)

## Method 1: EAS Build (Cloud Build - Recommended)

### Step 1: Login to Expo
```bash
npx expo login
```
Enter your Expo account credentials.

### Step 2: Build APK
For testing/preview APK:
```bash
npx eas-cli build --platform android --profile preview
```

For production APK:
```bash
npx eas-cli build --platform android --profile production
```

### Step 3: Download APK
- After build completes, you'll get a download link
- Or visit https://expo.dev/accounts/[your-username]/projects/wattly/builds
- Download the APK file to your device

## Method 2: Local Build (Requires Android Studio)

### Step 1: Prebuild
```bash
npx expo prebuild --platform android
```

### Step 2: Build locally
```bash
cd android
./gradlew assembleRelease
```

APK will be generated at: `android/app/build/outputs/apk/release/app-release.apk`

## Method 3: Expo Build (Legacy - Not recommended for new projects)

```bash
npx expo build:android
```

## Build Profiles Explained

### Development Profile
- Creates debug APK
- Includes development tools
- Larger file size
- For internal testing

### Preview Profile
- Creates release APK
- Optimized for testing
- Smaller file size
- For beta testing

### Production Profile
- Creates production-ready APK
- Fully optimized
- For app store or final distribution

## Troubleshooting

### Common Issues:

1. **"Invalid UUID appId" Error:**
   - Make sure you're logged into Expo
   - Ensure app.json has correct projectId

2. **Build Fails:**
   - Check all dependencies are compatible
   - Ensure app.json configuration is correct
   - Try clearing cache: `npx expo r -c`

3. **Permission Issues:**
   - Make sure all required permissions are in app.json
   - Check Android manifest permissions

### Current Project Configuration:
- App Name: WATTLY
- Package: com.swapnilpande.smartmeteroperations
- Version: 1.0.0
- Platform: Android (Portrait only)

## Next Steps After APK Creation:

1. **Install APK on Android device:**
   - Enable "Unknown Sources" in device settings
   - Download APK to device
   - Tap to install

2. **Test thoroughly:**
   - Test all OTP functionality (both demo and live API)
   - Test GPS and network capture
   - Test form submissions and sync

3. **Distribution:**
   - Share APK file directly
   - Upload to internal app distribution platform
   - Submit to Google Play Store (requires additional setup)

## Security Notes:
- Preview/Development APKs should not be distributed publicly
- Use Production profile for final distribution
- Consider code signing for production builds
