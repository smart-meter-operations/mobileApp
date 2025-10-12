import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  Linking,
} from 'react-native';
import * as Location from 'expo-location';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../constants';

// Conditional import - only import react-native-maps on native platforms
let MapView, Marker, PROVIDER_DEFAULT;
if (Platform.OS !== 'web') {
  try {
    const maps = require('react-native-maps');
    MapView = maps.default ? maps.default : null;
    Marker = maps.Marker ? maps.Marker : null;
    PROVIDER_DEFAULT = maps.PROVIDER_DEFAULT ? maps.PROVIDER_DEFAULT : null;
    
    // Additional check to ensure MapView is a valid component
    if (typeof MapView !== 'function') {
      MapView = null;
    }
    if (typeof Marker !== 'function') {
      Marker = null;
    }
  } catch (error) {
    console.warn('react-native-maps import failed:', error);
    MapView = null;
    Marker = null;
    PROVIDER_DEFAULT = null;
  }
} else {
  MapView = null;
  Marker = null;
  PROVIDER_DEFAULT = null;
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

export default function MapScreen({ route }) {
  const [userLocation, setUserLocation] = useState({
    latitude: 18.5204,
    longitude: 73.8567,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  
  const [consumerLocation, setConsumerLocation] = useState(null);
  const [showTransformers, setShowTransformers] = useState(true);
  const [showPoles, setShowPoles] = useState(true);
  const [showFeeders, setShowFeeders] = useState(true);
  const [mapError, setMapError] = useState(null);
  const [mapType, setMapType] = useState('standard');
  const [locationPermission, setLocationPermission] = useState(false);

  // Check if consumer location data is passed from route
  useEffect(() => {
    if (route?.params?.consumerLocation) {
      const { latitude, longitude, name, address } = route.params.consumerLocation;
      setConsumerLocation({
        latitude,
        longitude,
        name,
        address
      });
      
      // Center map on consumer location
      setUserLocation({
        latitude,
        longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }
  }, [route?.params?.consumerLocation]);

  // Get user's current location
  useEffect(() => {
    getUserLocation();
  }, []);

  const getUserLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationPermission(false);
        Alert.alert('Permission denied', 'Location permission is required to show your current location on the map.');
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
      Alert.alert('Location Error', 'Unable to get your current location.');
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

  const openNavigation = () => {
    if (!consumerLocation) {
      Alert.alert('No Destination', 'Please select a consumer location first.');
      return;
    }

    // For in-app navigation, we'll just focus the map on the consumer location
    // and show a route visualization if possible
    setUserLocation({
      latitude: consumerLocation.latitude,
      longitude: consumerLocation.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    });
    
    Alert.alert(
      'Navigation Started',
      `Navigating to ${consumerLocation.name}. The map is now centered on this location.`
    );
  };

  const switchToGoogleMaps = () => {
    const url = `https://www.google.com/maps/search/?api=1&query=${userLocation.latitude},${userLocation.longitude}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Unable to open Google Maps');
    });
  };

  // Function to center map on user's current location
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
      
      Alert.alert('Success', 'Map centered on your current location');
    } catch (error) {
      console.error('Error getting user location:', error);
      Alert.alert('Error', 'Unable to get your current location');
    }
  };

  // Function to center map on consumer location
  const centerOnConsumerLocation = () => {
    if (!consumerLocation) {
      Alert.alert('Error', 'No consumer location selected');
      return;
    }
    
    setUserLocation({
      latitude: consumerLocation.latitude,
      longitude: consumerLocation.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    });
    
    Alert.alert('Success', `Map centered on ${consumerLocation.name}`);
  };

  // Function to get directions between two points
  const getDirections = async (startLat, startLng, endLat, endLng) => {
    // This would be implemented with a directions API if needed
    // For now, we'll just center the map on the destination
    console.log('Getting directions from', startLat, startLng, 'to', endLat, endLng);
  };

  // Function to show route on map
  const showRouteOnMap = () => {
    if (!consumerLocation || !userLocation) {
      Alert.alert('Error', 'Both user and consumer locations are required to show route.');
      return;
    }
    
    // In a real implementation, this would draw a route between points
    // For now, we'll just ensure both locations are visible
    Alert.alert(
      'Route Information',
      `Route from your location to ${consumerLocation.name} would be displayed here.`
    );
  };

  // Function to simulate turn-by-turn navigation
  const startTurnByTurnNavigation = () => {
    if (!consumerLocation) {
      Alert.alert('Error', 'Consumer location is required for navigation.');
      return;
    }
    
    Alert.alert(
      'Navigation Started',
      `Turn-by-turn navigation to ${consumerLocation.name} would start here. In a full implementation, this would provide real-time directions.`
    );
  };

  // Show fallback UI for web platform or when maps are not available
  if (Platform.OS === 'web' || !MapView || MapView === null || typeof MapView !== 'function') {
    return (
      <View style={styles.container}>
        <View style={styles.webFallbackContainer}>
          <Text style={styles.webFallbackTitle}>Map View Not Available</Text>
          <Text style={styles.webFallbackText}>
            {Platform.OS === 'web' 
              ? 'Maps are not supported in the web version of this app.' 
              : 'react-native-maps library is not available.'}
          </Text>
          
          {consumerLocation && (
            <View style={styles.consumerInfo}>
              <Text style={styles.consumerName}>{consumerLocation.name}</Text>
              <Text style={styles.consumerAddress}>{consumerLocation.address}</Text>
              
              <TouchableOpacity
                style={styles.navigationButton}
                onPress={openNavigation}
              >
                <Text style={styles.navigationButtonText}>Open in Maps</Text>
              </TouchableOpacity>
            </View>
          )}
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={switchToGoogleMaps}
          >
            <Text style={styles.actionText}>Open Google Maps</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Fallback UI for when map fails to load
  if (mapError) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Map Loading Error</Text>
        <Text style={styles.errorText}>{mapError}</Text>
        <Text style={styles.errorHint}>
          Try switching to Google Maps or check your internet connection.
        </Text>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => setMapError(null)}
        >
          <Text style={styles.actionText}>Retry</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#4285F4' }]}
          onPress={switchToGoogleMaps}
        >
          <Text style={styles.actionText}>Open in Google Maps</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Render map for native platforms
  if (!MapView || MapView === null || typeof MapView !== 'function') {
    return (
      <View style={styles.container}>
        <View style={styles.webFallbackContainer}>
          <Text style={styles.webFallbackTitle}>Map Component Not Available</Text>
          <Text style={styles.webFallbackText}>
            The map component failed to load. Please check your installation.
          </Text>
        </View>
      </View>
    );
  }

  // Additional safety check before rendering
  if (!MapView || typeof MapView !== 'function' || !Marker || typeof Marker !== 'function') {
    return (
      <View style={styles.container}>
        <View style={styles.webFallbackContainer}>
          <Text style={styles.webFallbackTitle}>Map Component Not Available</Text>
          <Text style={styles.webFallbackText}>
            The map component failed to load properly. Please check your installation.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        provider={PROVIDER_DEFAULT}
        style={styles.map}
        region={userLocation}
        showsUserLocation={locationPermission}
        showsMyLocationButton={true}
        onError={handleMapError}
        onMapReady={() => console.log('Map is ready')}
        mapType={mapType}
      >
        {/* User Location Marker */}
        {locationPermission && Marker && typeof Marker === 'function' && (
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
        {consumerLocation && Marker && typeof Marker === 'function' && (
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
        {showTransformers && Marker && typeof Marker === 'function' &&
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
        {showPoles && Marker && typeof Marker === 'function' &&
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
        {showFeeders && Marker && typeof Marker === 'function' &&
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

      {/* Navigation Controls - only show when consumer location is selected */}
      {consumerLocation && (
        <View style={styles.navigationControls}>
          <TouchableOpacity
            style={[styles.navigationButton, { marginBottom: SPACING.sm }]}
            onPress={openNavigation}
          >
            <Text style={styles.navigationButtonText}>Center on Location</Text>
          </TouchableOpacity>
                  
          <TouchableOpacity
            style={[styles.navigationButton, { backgroundColor: COLORS.secondary }]}
            onPress={showRouteOnMap}
          >
            <Text style={styles.navigationButtonText}>Show Route</Text>
          </TouchableOpacity>
                  
          <TouchableOpacity
            style={[styles.navigationButton, { backgroundColor: COLORS.success }]}
            onPress={startTurnByTurnNavigation}
          >
            <Text style={styles.navigationButtonText}>Start Navigation</Text>
          </TouchableOpacity>
        </View>
      )}
              
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
  );
}

const styles = StyleSheet.create({
  actionButton: {
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    width: '80%',
  },
  actionText: {
    color: COLORS.white,
    fontWeight: TYPOGRAPHY.fontWeights.semibold,
  },
  navigationControls: {
    bottom: 120,
    left: SPACING.xl,
    position: 'absolute',
    right: SPACING.xl,
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
  container: {
    backgroundColor: COLORS.background,
    flex: 1,
  },
  consumerAddress: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSizes.base,
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
  consumerInfo: {
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.xl,
    padding: SPACING.lg,
    width: '80%',
  },
  consumerName: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSizes.xl,
    fontWeight: TYPOGRAPHY.fontWeights.bold,
    marginBottom: SPACING.sm,
    textAlign: 'center',
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
  map: {
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
  navigationButton: {
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.lg,
    bottom: 90,
    elevation: 5,
    left: SPACING.xl,
    padding: SPACING.md,
    position: 'absolute',
    right: SPACING.xl,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  navigationButtonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSizes.lg,
    fontWeight: TYPOGRAPHY.fontWeights.bold,
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
  webFallbackContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  webFallbackText: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSizes.base,
    marginBottom: SPACING.xl,
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