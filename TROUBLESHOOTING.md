# Troubleshooting Guide

## Map Issues

### "Runtime not ready" or "TypeError: 0" Errors

This error typically occurs when the map component is not properly configured. Since we're now using OpenStreetMap, API keys are no longer required, but other issues can still cause this error:

1. **Check Internet Connection**
   - Ensure the device has an active internet connection

2. **Verify Map Component Installation**
   ```bash
   npm install react-native-maps
   ```

3. **Rebuild the Application**
   - After updating dependencies, you need to rebuild the app:
   ```bash
   # For Expo Go
   npm start
   
   # For development builds
   expo build:android
   expo build:ios
   ```

### Map Not Loading or Showing Gray Screen

1. **Check Internet Connection**
   - Ensure the device has an active internet connection

2. **Check Console Logs**
   - Look for specific error messages in the console

3. **Test Map Type Switching**
   - Try switching between different map types using the controls in the top-right corner

### Location Not Showing

1. **Check Location Permissions**
   - Ensure location permissions are granted to the app

2. **Verify Location Services**
   - Make sure device location services are enabled

3. **Test on Physical Device**
   - Location features may not work properly on emulators

## General Issues

### Dependency Version Mismatches

If you see warnings about package version mismatches:

1. **Update Packages**
   ```bash
   npm install
   ```

2. **Fix Versions**
   ```bash
   expo install expo-location
   expo install react-native-maps
   ```

### Build Issues

1. **Clear Cache**
   ```bash
   expo r -c
   ```

2. **Reinstall Dependencies**
   ```bash
   rm -rf node_modules
   npm install
   ```

## Need Help?

If you're still experiencing issues:

1. Check the console logs for specific error messages
2. Ensure all required dependencies are installed
3. Test on a physical device rather than an emulator when possible
4. Verify internet connectivity for OpenStreetMap tiles to load