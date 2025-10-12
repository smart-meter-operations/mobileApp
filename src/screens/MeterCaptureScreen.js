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
import { COLORS } from '../constants';

const MeterCaptureScreen = ({ navigation, route }) => {
  const [hasPermissions, setHasPermissions] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [locationData, setLocationData] = useState(null);
  const [networkData, setNetworkData] = useState(null);
  const [cameraType, setCameraType] = useState('back');

  const cameraRef = useRef(null);

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
      await processCapture(photoResult);
    } catch (error) {
      console.error('Capture photo failed:', error);
      showError('Failed to capture photo');
    } finally {
      setCapturing(false);
    }
  };

  const processCapture = async (photoResult) => {
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

      // Pass data to Meter Info screen
      navigation.navigate('MeterInfo', {
        photoUri: permanentUri,
        locationData: location,
        networkData: network
      });
    } catch (error) {
      console.error('Process capture failed:', error);
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
      const filename = `meter_${timestamp}.jpg`;
      const permanentUri = `${FileSystem.documentDirectory}meters/${filename}`;

      // Ensure meters directory exists
      await FileSystem.makeDirectoryAsync(
        `${FileSystem.documentDirectory}meters/`,
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
          <Ionicons name="camera-outline" size={80} color={COLORS.gray} />
          <Text style={styles.permissionTitle}>
            Camera & Location Access Required
          </Text>
          <Text style={styles.permissionMessage}>
            This feature requires camera and location permissions to capture
            photos with location data.
          </Text>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={checkPermissions}
          >
            <Text style={styles.permissionButtonText}>Grant Permissions</Text>
          </TouchableOpacity>
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
              <ActivityIndicator size="large" color={COLORS.primary} />
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
            <TouchableOpacity
              style={[styles.reviewButton, styles.retakeButton]}
              onPress={retakePhoto}
              disabled={processing}
            >
              <Text style={styles.reviewButtonText}>Retake</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.reviewButton, styles.confirmButton]}
              onPress={() => navigation.navigate('MeterInfo', {
                photoUri: capturedPhoto.uri,
                locationData: locationData,
                networkData: networkData
              })}
              disabled={processing}
            >
              <Text style={styles.reviewButtonText}>Extract Meter Info</Text>
            </TouchableOpacity>
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

          {/* Camera guide overlay */}
          <View style={styles.guideOverlay}>
            <View style={styles.guideFrame}>
              <Text style={styles.guideText}>Position meter within frame</Text>
            </View>
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
    color: COLORS.primary,
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
    backgroundColor: COLORS.success,
  },
  container: {
    backgroundColor: COLORS.background,
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
    color: COLORS.error,
    fontSize: 14,
    fontStyle: 'italic',
  },
  dataSection: {
    backgroundColor: COLORS.white,
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
    color: COLORS.text,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  dataText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginBottom: 5,
  },
  guideFrame: {
    borderColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 10,
    borderWidth: 2,
    height: 200,
    width: 300,
  },
  guideOverlay: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  guideText: {
    color: 'white',
    fontSize: 16,
    marginTop: 20,
    textAlign: 'center',
  },
  permissionButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    marginBottom: 15,
    padding: 15,
  },
  permissionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  permissionContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  permissionMessage: {
    color: COLORS.textSecondary,
    fontSize: 16,
    lineHeight: 24,
    marginVertical: 20,
    textAlign: 'center',
  },
  permissionTitle: {
    color: COLORS.text,
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
    color: COLORS.text,
    fontSize: 16,
    marginTop: 10,
  },
  retakeButton: {
    backgroundColor: COLORS.gray,
  },
  reviewButton: {
    alignItems: 'center',
    borderRadius: 8,
    flex: 1,
    padding: 15,
  },
  reviewButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  reviewButtons: {
    flexDirection: 'row',
    gap: 15,
    padding: 20,
  },
  reviewContainer: {
    backgroundColor: COLORS.background,
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

export default MeterCaptureScreen;