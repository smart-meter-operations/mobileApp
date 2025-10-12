import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
  Platform,
} from 'react-native';
import * as Location from 'expo-location';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../constants';

// Conditional import - only import react-native-maps on native platforms
let MapView, Marker, PROVIDER_DEFAULT, PROVIDER_GOOGLE;

// Try to import react-native-maps with better error handling
try {
  if (Platform.OS !== 'web') {
    console.log('Attempting to import react-native-maps for native platform');
    const mapsModule = require('react-native-maps');
    console.log('react-native-maps module loaded:', !!mapsModule);
    
    // Handle different export formats based on the console logs
    if (mapsModule) {
      // From the logs, we can see MapView is directly a function
      MapView = mapsModule.default || mapsModule.MapView || mapsModule;
      Marker = mapsModule.Marker;
      PROVIDER_DEFAULT = mapsModule.PROVIDER_DEFAULT;
      PROVIDER_GOOGLE = mapsModule.PROVIDER_GOOGLE;
      
      console.log('Component types - MapView:', typeof MapView, 'Marker:', typeof Marker);
    }
  } else {
    console.log('Platform is web, skipping react-native-maps import');
  }
} catch (error) {
  console.warn('Failed to import react-native-maps:', error.message);
  console.warn('Stack trace:', error.stack);
  MapView = null;
  Marker = null;
  PROVIDER_DEFAULT = null;
  PROVIDER_GOOGLE = null;
}

// Mock data for transformers, poles, and feeders
const mockTransformers = [
  { id: 1, latitude: 18.5204, longitude: 73.8567, name: 'Transformer 1' },
  { id: 2, latitude: 18.5214, longitude: 73.8577, name: 'Transformer 2' },
  { id: 3, latitude: 18.5194, longitude: 73.8557, name: 'Transformer 3' },
];

const mockPoles = [
  { id: 1, latitude: 18.52, longitude: 73.856, name: 'Pole 1' },
  { id: 2, latitude: 18.5208, longitude: 73.857, name: 'Pole 2' },
  { id: 3, latitude: 18.521, longitude: 73.8565, name: 'Pole 3' },
  { id: 4, latitude: 18.5198, longitude: 73.8555, name: 'Pole 4' },
];

const mockFeeders = [
  { id: 1, latitude: 18.5206, longitude: 73.8563, name: 'Feeder 1' },
  { id: 2, latitude: 18.5212, longitude: 73.8573, name: 'Feeder 2' },
];

const MapModal = ({ visible, onClose, consumerLocation }) => {
  const [userLocation, setUserLocation] = useState({
    latitude: 18.5204,
    longitude: 73.8567,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  
  const [showTransformers, setShowTransformers] = useState(true);
  const [showPoles, setShowPoles] = useState(true);
  const [showFeeders, setShowFeeders] = useState(true);
  const [mapError, setMapError] = useState(null);
  const [mapType, setMapType] = useState('standard');
  const [locationPermission, setLocationPermission] = useState(false);

  // Check if consumer location data is passed
  useEffect(() => {
    if (consumerLocation) {
      const { latitude, longitude, name, address } = consumerLocation;
      setUserLocation({
        latitude,
        longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }
  }, [consumerLocation]);

  // Get user's current location
  useEffect(() => {
    getUserLocation();
  }, []);

  const getUserLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationPermission(false);
        return;
      }

      setLocationPermission(true);
      let location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      
      // Update user location only if we're not focusing on a consumer
      if (!consumerLocation) {
        setUserLocation({
          latitude,
          longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
      }
    } catch (error) {
      console.error('Error getting user location:', error);
    }
  };

  const toggleTransformers = () => {
    setShowTransformers(!showTransformers);
  };

  const togglePoles = () => {
    setShowPoles(!showPoles);
  };

  const toggleFeeders = () => {
    setShowFeeders(!showFeeders);
  };

  const handleMapError = (error) => {
    console.error('Map error:', error);
    setMapError(error.message || 'Failed to load map');
  };

  const centerOnUserLocation = async () => {
    try {
      let location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      
      setUserLocation({
        latitude,
        longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    } catch (error) {
      console.error('Error getting user location:', error);
      Alert.alert('Error', 'Unable to get your current location');
    }
  };

  // Show fallback UI for web platform or when maps are not available
  const isMapAvailable = Platform.OS !== 'web' && MapView && Marker && 
                        typeof MapView === 'function' && typeof Marker === 'function';
  console.log('Map availability check - Platform:', Platform.OS, 'isMapAvailable:', isMapAvailable);
  console.log('MapView component:', MapView, 'Marker component:', Marker);

  if (Platform.OS === 'web' || !isMapAvailable) {
    return (
      <Modal
        animationType="slide"
        transparent={false}
        visible={visible}
        onRequestClose={onClose}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Map View</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.webFallbackContainer}>
            <Text style={styles.webFallbackTitle}>Map View Not Available</Text>
            <Text style={styles.webFallbackText}>
              {Platform.OS === 'web' 
                ? 'Maps are not supported in the web version of this app.' 
                : 'react-native-maps library is not available. Please check your installation.'}
            </Text>
            <Text style={styles.webFallbackText}>
              Debug Info: Platform={Platform.OS}, MapView={!!MapView}, Marker={!!Marker}
            </Text>
            <TouchableOpacity style={styles.closeButtonBottom} onPress={onClose}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  // Fallback UI for when map fails to load
  if (mapError) {
    return (
      <Modal
        animationType="slide"
        transparent={false}
        visible={visible}
        onRequestClose={onClose}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Map View</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.errorContainer}>
            <Text style={styles.errorTitle}>Map Loading Error</Text>
            <Text style={styles.errorText}>{mapError}</Text>
            <Text style={styles.errorHint}>
              Try again or check your internet connection.
            </Text>
            <TouchableOpacity style={styles.closeButtonBottom} onPress={onClose}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  // Determine the provider based on platform
  const mapProvider = Platform.OS === 'android' ? PROVIDER_GOOGLE : PROVIDER_DEFAULT;

  // Render map for native platforms
  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Map View</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.mapContainer}>
          <MapView
            provider={mapProvider}
            style={styles.map}
            region={userLocation}
            showsUserLocation={locationPermission}
            showsMyLocationButton={true}
            onError={handleMapError}
            onMapReady={() => console.log('Map is ready')}
            mapType={mapType}
          >
            {/* User Location Marker */}
            {locationPermission && (
              <Marker
                coordinate={{
                  latitude: userLocation.latitude,
                  longitude: userLocation.longitude,
                }}
                title="Your Location"
                pinColor={COLORS.primary}
              />
            )}

            {/* Consumer Location Marker */}
            {consumerLocation && (
              <Marker
                coordinate={{
                  latitude: consumerLocation.latitude,
                  longitude: consumerLocation.longitude,
                }}
                title={consumerLocation.name}
                description={consumerLocation.address}
                pinColor="#FF3B30"
              />
            )}

            {/* Transformers */}
            {showTransformers &&
              mockTransformers.map((transformer) => (
                <Marker
                  key={transformer.id}
                  coordinate={{
                    latitude: transformer.latitude,
                    longitude: transformer.longitude,
                  }}
                  title={transformer.name}
                  description="Transformer"
                >
                  <View style={[styles.marker, { backgroundColor: '#FF5722' }]}>
                    <Text style={styles.markerIcon}>⚡</Text>
                  </View>
                </Marker>
              ))}

            {/* Poles */}
            {showPoles &&
              mockPoles.map((pole) => (
                <Marker
                  key={pole.id}
                  coordinate={{
                    latitude: pole.latitude,
                    longitude: pole.longitude,
                  }}
                  title={pole.name}
                  description="Pole"
                >
                  <View style={[styles.marker, { backgroundColor: '#9E9E9E' }]}>
                    <Text style={styles.markerIcon}>📍</Text>
                  </View>
                </Marker>
              ))}

            {/* Feeders */}
            {showFeeders &&
              mockFeeders.map((feeder) => (
                <Marker
                  key={feeder.id}
                  coordinate={{
                    latitude: feeder.latitude,
                    longitude: feeder.longitude,
                  }}
                  title={feeder.name}
                  description="Feeder"
                >
                  <View style={[styles.marker, { backgroundColor: '#4CAF50' }]}>
                    <Text style={styles.markerIcon}>🔌</Text>
                  </View>
                </Marker>
              ))}
          </MapView>

          {/* User Location Button */}
          <TouchableOpacity
            style={styles.userLocationButton}
            onPress={centerOnUserLocation}
          >
            <Text style={styles.userLocationButtonText}>📍</Text>
          </TouchableOpacity>

          {/* Toggle Controls */}
          <View style={styles.controlsContainer}>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                {
                  backgroundColor: showTransformers
                    ? COLORS.primary
                    : COLORS.background,
                },
              ]}
              onPress={toggleTransformers}
            >
              <Text
                style={[
                  styles.toggleText,
                  { color: showTransformers ? COLORS.white : COLORS.text },
                ]}
              >
                Transformers
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.toggleButton,
                { backgroundColor: showPoles ? COLORS.primary : COLORS.background },
              ]}
              onPress={togglePoles}
            >
              <Text
                style={[
                  styles.toggleText,
                  { color: showPoles ? COLORS.white : COLORS.text },
                ]}
              >
                Poles
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.toggleButton,
                {
                  backgroundColor: showFeeders ? COLORS.primary : COLORS.background,
                },
              ]}
              onPress={toggleFeeders}
            >
              <Text
                style={[
                  styles.toggleText,
                  { color: showFeeders ? COLORS.white : COLORS.text },
                ]}
              >
                Feeders
              </Text>
            </TouchableOpacity>
          </View>

          {/* Map Type Switcher */}
          <View style={styles.mapTypeContainer}>
            <TouchableOpacity
              style={[
                styles.mapTypeButton,
                {
                  backgroundColor:
                    mapType === 'standard'
                      ? COLORS.primary
                      : COLORS.background,
                },
              ]}
              onPress={() => setMapType('standard')}
            >
              <Text
                style={[
                  styles.mapTypeText,
                  {
                    color: mapType === 'standard' ? COLORS.white : COLORS.text,
                  },
                ]}
              >
                Standard
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.mapTypeButton,
                {
                  backgroundColor:
                    mapType === 'satellite' ? COLORS.primary : COLORS.background,
                },
              ]}
              onPress={() => setMapType('satellite')}
            >
              <Text
                style={[
                  styles.mapTypeText,
                  { color: mapType === 'satellite' ? COLORS.white : COLORS.text },
                ]}
              >
                Satellite
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  closeButton: {
    padding: SPACING.md,
  },
  closeButtonBottom: {
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    marginTop: SPACING.xl,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    width: '80%',
  },
  closeButtonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSizes.lg,
    fontWeight: TYPOGRAPHY.fontWeights.bold,
  },
  container: {
    backgroundColor: COLORS.background,
    flex: 1,
  },
  controlsContainer: {
    bottom: SPACING.xl,
    flexDirection: 'row',
    justifyContent: 'space-between',
    left: SPACING.lg,
    paddingHorizontal: SPACING.md,
    position: 'absolute',
    right: SPACING.lg,
  },
  errorContainer: {
    alignItems: 'center',
    backgroundColor: COLORS.background,
    flex: 1,
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  errorHint: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSizes.sm,
    marginBottom: SPACING.xl,
    textAlign: 'center',
  },
  errorText: {
    color: COLORS.text,
    fontSize: TYPOGRAPHY.fontSizes.base,
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
  errorTitle: {
    color: COLORS.error,
    fontSize: TYPOGRAPHY.fontSizes.xl,
    fontWeight: TYPOGRAPHY.fontWeights.bold,
    marginBottom: SPACING.md,
  },
  header: {
    alignItems: 'center',
    backgroundColor: COLORS.headerBackground,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  headerTitle: {
    color: COLORS.textWhite,
    fontSize: TYPOGRAPHY.fontSizes.xl,
    fontWeight: TYPOGRAPHY.fontWeights.bold,
  },
  map: {
    flex: 1,
  },
  mapContainer: {
    flex: 1,
  },
  mapTypeButton: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  mapTypeContainer: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    elevation: 3,
    flexDirection: 'row',
    overflow: 'hidden',
    position: 'absolute',
    right: SPACING.lg,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    top: SPACING.lg,
  },
  mapTypeText: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    fontWeight: TYPOGRAPHY.fontWeights.semibold,
  },
  marker: {
    alignItems: 'center',
    borderColor: COLORS.white,
    borderRadius: 15,
    borderWidth: 2,
    height: 30,
    justifyContent: 'center',
    width: 30,
  },
  markerIcon: {
    color: COLORS.white,
    fontSize: 16,
  },
  toggleButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    elevation: 3,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  toggleText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSizes.sm,
    fontWeight: TYPOGRAPHY.fontWeights.semibold,
  },
  userLocationButton: {
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderColor: COLORS.primary,
    borderRadius: 20,
    borderWidth: 1,
    elevation: 5,
    height: 40,
    justifyContent: 'center',
    position: 'absolute',
    right: SPACING.lg,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    top: SPACING.xl,
    width: 40,
  },
  userLocationButtonText: {
    color: COLORS.primary,
    fontSize: 20,
  },
  webFallbackContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  webFallbackText: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSizes.base,
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
  webFallbackTitle: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSizes['2xl'],
    fontWeight: TYPOGRAPHY.fontWeights.bold,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
});

export default MapModal;