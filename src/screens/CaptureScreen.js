import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import * as FileSystem from 'expo-file-system/legacy';
import { Ionicons } from '@expo/vector-icons';

// Import services
import PermissionsService from '../services/permissionsService';
import NetworkService from '../services/networkService';
import DatabaseService from '../services/databaseService';

// Import components and styles
// import Button from '../components/Button';
import { COLORS } from '../constants';

// Define COLORS that might be missing
const SAFE_COLORS = {
  primary: '#2b2b2b', // Dark grey instead of black
  background: '#f5f5f5', // Light grey background
  text: '#212121', // Dark text
  textSecondary: '#757575', // Medium grey text
  gray: '#9e9e9e', // Light grey
  white: '#ffffff',
  success: '#4caf50', // Green
  error: '#f44336', // Red
  ...COLORS, // Spread existing colors
};

// Temporary simple button component
const SimpleButton = ({ title, onPress, style, disabled }) => (
  <TouchableOpacity
    style={[
      {
        backgroundColor: disabled ? '#cccccc' : SAFE_COLORS.primary,
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        alignItems: 'center',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      style,
    ]}
    onPress={disabled ? null : onPress}
    disabled={disabled}
  >
    <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>
      {title}
    </Text>
  </TouchableOpacity>
);

const CaptureScreen = ({ navigation, route }) => {
  const [hasPermissions, setHasPermissions] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [locationData, setLocationData] = useState(null);
  const [networkData, setNetworkData] = useState(null);
  const [cameraType, setCameraType] = useState('back');

  const cameraRef = useRef(null);
  const { installationId } = route.params || {};

  // Initialize screen
  useEffect(() => {
    initializeCapture();
    return () => {
      // Cleanup
    };
  }, []);

  const initializeCapture = async () => {
    try {
      // Initialize database service first
      await DatabaseService.initialize();

      // Initialize network service
      await NetworkService.initialize();

      // Check and request permissions
      await checkPermissions();
    } catch (error) {
      console.error('Initialize capture failed:', error);
      showError('Failed to initialize capture feature');
    }
  };

  const checkPermissions = async () => {
    try {
      const permissionStatus =
        await PermissionsService.checkCapturePermissions();

      if (permissionStatus.allGranted) {
        setHasPermissions(true);
        return;
      }

      // Handle permission request
      PermissionsService.handleCapturePermissions(
        () => {
          setHasPermissions(true);
        },
        (error) => {
          console.error('Permissions denied:', error);
          Alert.alert(
            'Permissions Required',
            'Camera and location permissions are required for this feature. Please enable them to continue.',
            [
              { text: 'Cancel', onPress: () => navigation.goBack() },
              { text: 'Retry', onPress: () => checkPermissions() },
            ]
          );
        }
      );
    } catch (error) {
      console.error('Check permissions failed:', error);
      showError('Failed to check permissions');
    }
  };

  const onCameraReady = () => {
    setCameraReady(true);
    console.log('Camera ready');
  };

  const capturePhoto = async () => {
    if (!cameraRef.current || !cameraReady || capturing) {
      return;
    }

    try {
      setCapturing(true);

      console.log('Starting photo capture...');

      // Capture photo
      const photoResult = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
        exif: true,
      });

      console.log('Photo captured:', photoResult.uri);
      setCapturedPhoto(photoResult);

      // Start processing location and network data
      setProcessing(true);
      await processAndSaveCapture(photoResult);
    } catch (error) {
      console.error('Capture photo failed:', error);
      showError('Failed to capture photo');
    } finally {
      setCapturing(false);
    }
  };

  const processAndSaveCapture = async (photoResult) => {
    try {
      console.log('Processing capture data...');

      // Get location data
      const location = await getCurrentLocation();
      setLocationData(location);

      // Get network data
      const network = await NetworkService.getCaptureNetworkInfo();
      setNetworkData(network);

      // Save to permanent location
      const permanentUri = await savePhotoToPermanentLocation(photoResult.uri);

      // Save to database
      const captureData = {
        installation_id: installationId || null,
        image_path: permanentUri,
        latitude: location?.latitude || null,
        longitude: location?.longitude || null,
        network_type: network.connection.type,
        signal_strength: JSON.stringify(network.signal),
        connection_quality: network.speed.quality,
        bandwidth_info: network.speed,
      };

      const saveResult = await DatabaseService.saveCapture(captureData);

      if (saveResult.success) {
        console.log('Capture saved successfully:', saveResult.id);
        showSuccess('Photo captured and saved successfully!');
      } else {
        throw new Error(saveResult.error);
      }
    } catch (error) {
      console.error('Process and save capture failed:', error);
      showError('Failed to process capture data');
    } finally {
      setProcessing(false);
    }
  };

  const getCurrentLocation = async () => {
    try {
      console.log('Getting current location...');

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeout: 10000,
      });

      const { latitude, longitude } = location.coords;

      console.log('Location obtained:', { latitude, longitude });

      return {
        latitude,
        longitude,
        accuracy: location.coords.accuracy,
        timestamp: new Date(location.timestamp).toISOString(),
      };
    } catch (error) {
      console.error('Get current location failed:', error);
      return null;
    }
  };

  const savePhotoToPermanentLocation = async (tempUri) => {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `capture_${timestamp}.jpg`;
      const permanentUri = `${FileSystem.documentDirectory}captures/${filename}`;

      // Ensure captures directory exists
      await FileSystem.makeDirectoryAsync(
        `${FileSystem.documentDirectory}captures/`,
        { intermediates: true }
      );

      // Move file to permanent location
      await FileSystem.moveAsync({
        from: tempUri,
        to: permanentUri,
      });

      console.log('Photo saved to:', permanentUri);
      return permanentUri;
    } catch (error) {
      console.error('Save photo to permanent location failed:', error);
      return tempUri; // Return original URI as fallback
    }
  };

  const retakePhoto = () => {
    setCapturedPhoto(null);
    setLocationData(null);
    setNetworkData(null);
    setProcessing(false);
  };

  const confirmCapture = () => {
    // Navigate back with success
    navigation.goBack();
  };

  const flipCamera = () => {
    setCameraType(cameraType === 'back' ? 'front' : 'back');
  };

  const showError = (message) => {
    Alert.alert('Error', message, [{ text: 'OK' }]);
  };

  const showSuccess = (message) => {
    Alert.alert('Success', message, [{ text: 'OK' }]);
  };

  // Render permission denied screen
  if (!hasPermissions) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <Ionicons name="camera-outline" size={80} color={SAFE_COLORS.gray} />
          <Text style={styles.permissionTitle}>
            Camera & Location Access Required
          </Text>
          <Text style={styles.permissionMessage}>
            This feature requires camera and location permissions to capture
            photos with location data.
          </Text>
          <SimpleButton
            title="Grant Permissions"
            onPress={checkPermissions}
            style={styles.permissionButton}
          />
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Render captured photo review screen
  if (capturedPhoto) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.reviewContainer}>
          <Image
            source={{ uri: capturedPhoto.uri }}
            style={styles.capturedImage}
          />

          {processing && (
            <View style={styles.processingContainer}>
              <ActivityIndicator size="large" color={SAFE_COLORS.primary} />
              <Text style={styles.processingText}>
                Processing capture data...
              </Text>
            </View>
          )}

          {!processing && (
            <View style={styles.dataContainer}>
              {/* Location Data */}
              <View style={styles.dataSection}>
                <Text style={styles.dataSectionTitle}>📍 Location Data</Text>
                {locationData ? (
                  <View>
                    <Text style={styles.dataText}>
                      Latitude: {locationData.latitude.toFixed(6)}
                    </Text>
                    <Text style={styles.dataText}>
                      Longitude: {locationData.longitude.toFixed(6)}
                    </Text>
                    <Text style={styles.dataText}>
                      Accuracy: {locationData.accuracy.toFixed(2)}m
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.dataError}>
                    Location data not available
                  </Text>
                )}
              </View>

              {/* Network Data */}
              <View style={styles.dataSection}>
                <Text style={styles.dataSectionTitle}>📶 Network Data</Text>
                {networkData ? (
                  <View>
                    <Text style={styles.dataText}>
                      Connection: {networkData.connection.type.toUpperCase()}
                    </Text>
                    <Text style={styles.dataText}>
                      Signal: {networkData.signal.quality} (
                      {networkData.signal.strength})
                    </Text>
                    <Text style={styles.dataText}>
                      Speed: {networkData.speed.downloadSpeed} Mbps (
                      {networkData.speed.quality})
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.dataError}>
                    Network data not available
                  </Text>
                )}
              </View>
            </View>
          )}

          <View style={styles.reviewButtons}>
            <SimpleButton
              title="Retake"
              onPress={retakePhoto}
              style={[styles.reviewButton, styles.retakeButton]}
              disabled={processing}
            />
            <SimpleButton
              title="Confirm"
              onPress={confirmCapture}
              style={[styles.reviewButton, styles.confirmButton]}
              disabled={processing}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Render camera screen
  return (
    <SafeAreaView style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={cameraType}
        onCameraReady={onCameraReady}
      >
        <View style={styles.cameraOverlay}>
          {/* Top controls */}
          <View style={styles.topControls}>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="close" size={30} color="white" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.controlButton} onPress={flipCamera}>
              <Ionicons name="camera-reverse" size={30} color="white" />
            </TouchableOpacity>
          </View>

          {/* Bottom controls */}
          <View style={styles.bottomControls}>
            <TouchableOpacity
              style={[
                styles.captureButton,
                capturing && styles.captureButtonDisabled,
              ]}
              onPress={capturePhoto}
              disabled={!cameraReady || capturing}
            >
              {capturing ? (
                <ActivityIndicator size="large" color="white" />
              ) : (
                <View style={styles.captureButtonInner} />
              )}
            </TouchableOpacity>
          </View>

          {/* Status indicator */}
          {!cameraReady && (
            <View style={styles.statusContainer}>
              <ActivityIndicator size="large" color="white" />
              <Text style={styles.statusText}>Initializing camera...</Text>
            </View>
          )}
        </View>
      </CameraView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  bottomControls: {
    alignItems: 'center',
    bottom: 40,
    left: 0,
    position: 'absolute',
    right: 0,
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    backgroundColor: 'transparent',
    flex: 1,
  },
  cancelText: {
    color: SAFE_COLORS.primary,
    fontSize: 16,
    textAlign: 'center',
  },
  captureButton: {
    alignItems: 'center',
    backgroundColor: 'white',
    borderColor: 'rgba(255,255,255,0.5)',
    borderRadius: 40,
    borderWidth: 4,
    height: 80,
    justifyContent: 'center',
    width: 80,
  },
  captureButtonDisabled: {
    opacity: 0.5,
  },
  captureButtonInner: {
    backgroundColor: 'white',
    borderRadius: 30,
    height: 60,
    width: 60,
  },
  capturedImage: {
    height: 300,
    resizeMode: 'cover',
    width: '100%',
  },
  confirmButton: {
    backgroundColor: SAFE_COLORS.success,
  },
  container: {
    backgroundColor: SAFE_COLORS.background,
    flex: 1,
  },
  controlButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 25,
    height: 50,
    justifyContent: 'center',
    width: 50,
  },
  dataContainer: {
    padding: 20,
  },
  dataError: {
    color: SAFE_COLORS.error,
    fontSize: 14,
    fontStyle: 'italic',
  },
  dataSection: {
    backgroundColor: SAFE_COLORS.white,
    borderRadius: 10,
    elevation: 2,
    marginBottom: 20,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dataSectionTitle: {
    color: SAFE_COLORS.text,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  dataText: {
    color: SAFE_COLORS.textSecondary,
    fontSize: 14,
    marginBottom: 5,
  },
  permissionButton: {
    marginBottom: 15,
  },
  permissionContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  permissionMessage: {
    color: SAFE_COLORS.textSecondary,
    fontSize: 16,
    lineHeight: 24,
    marginVertical: 20,
    textAlign: 'center',
  },
  permissionTitle: {
    color: SAFE_COLORS.text,
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 20,
    textAlign: 'center',
  },
  processingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  processingText: {
    color: SAFE_COLORS.text,
    fontSize: 16,
    marginTop: 10,
  },
  retakeButton: {
    backgroundColor: SAFE_COLORS.gray,
  },
  reviewButton: {
    flex: 1,
  },
  reviewButtons: {
    flexDirection: 'row',
    gap: 15,
    padding: 20,
  },
  reviewContainer: {
    backgroundColor: SAFE_COLORS.background,
    flex: 1,
  },
  statusContainer: {
    alignItems: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: '50%',
  },
  statusText: {
    color: 'white',
    fontSize: 16,
    marginTop: 10,
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
});

export default CaptureScreen;
