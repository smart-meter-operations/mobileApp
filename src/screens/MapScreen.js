import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform, Linking } from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../constants';

// Mock data for transformers, poles, and feeders
const mockTransformers = [
  { id: 1, latitude: 18.5204, longitude: 73.8567, name: 'Transformer 1' },
  { id: 2, latitude: 18.5214, longitude: 73.8577, name: 'Transformer 2' },
  { id: 3, latitude: 18.5194, longitude: 73.8557, name: 'Transformer 3' },
];

const mockPoles = [
  { id: 1, latitude: 18.5200, longitude: 73.8560, name: 'Pole 1' },
  { id: 2, latitude: 18.5208, longitude: 73.8570, name: 'Pole 2' },
  { id: 3, latitude: 18.5210, longitude: 73.8565, name: 'Pole 3' },
  { id: 4, latitude: 18.5198, longitude: 73.8555, name: 'Pole 4' },
];

const mockFeeders = [
  { id: 1, latitude: 18.5206, longitude: 73.8563, name: 'Feeder 1' },
  { id: 2, latitude: 18.5212, longitude: 73.8573, name: 'Feeder 2' },
];

export default function MapScreen() {
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
  const [mapType, setMapType] = useState('openstreetmap');

  // In a real app, you would get the user's actual location using expo-location
  useEffect(() => {
    // Mock getting user location
    console.log('Getting user location...');
  }, []);

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

  const switchToGoogleMaps = () => {
    const url = `https://www.google.com/maps/search/?api=1&query=${userLocation.latitude},${userLocation.longitude}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Unable to open Google Maps');
    });
  };

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

  return (
    <View style={styles.container}>
      <MapView
        provider={PROVIDER_DEFAULT}
        style={styles.map}
        region={userLocation}
        showsUserLocation={true}
        showsMyLocationButton={true}
        onError={handleMapError}
        onMapReady={() => console.log('Map is ready')}
      >
        
        {/* User Location Marker */}
        <Marker
          coordinate={{
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
          }}
          title="Your Location"
          pinColor={COLORS.primary}
        />

        {/* Transformers */}
        {showTransformers &&
          mockTransformers.map(transformer => (
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
          mockPoles.map(pole => (
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
          mockFeeders.map(feeder => (
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

      {/* Toggle Controls */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            { backgroundColor: showTransformers ? COLORS.primary : COLORS.background },
          ]}
          onPress={toggleTransformers}
        >
          <Text style={[
            styles.toggleText,
            { color: showTransformers ? COLORS.white : COLORS.text }
          ]}>
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
          <Text style={[
            styles.toggleText,
            { color: showPoles ? COLORS.white : COLORS.text }
          ]}>
            Poles
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.toggleButton,
            { backgroundColor: showFeeders ? COLORS.primary : COLORS.background },
          ]}
          onPress={toggleFeeders}
        >
          <Text style={[
            styles.toggleText,
            { color: showFeeders ? COLORS.white : COLORS.text }
          ]}>
            Feeders
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Map Type Switcher */}
      <View style={styles.mapTypeContainer}>
        <TouchableOpacity 
          style={[styles.mapTypeButton, { backgroundColor: mapType === 'openstreetmap' ? COLORS.primary : COLORS.background }]}
          onPress={() => setMapType('openstreetmap')}
        >
          <Text style={[styles.mapTypeText, { color: mapType === 'openstreetmap' ? COLORS.white : COLORS.text }]}>
            OSM
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.mapTypeButton, { backgroundColor: mapType === 'none' ? COLORS.primary : COLORS.background }]}
          onPress={() => setMapType('none')}
        >
          <Text style={[styles.mapTypeText, { color: mapType === 'none' ? COLORS.white : COLORS.text }]}>
            None
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  map: {
    flex: 1,
  },
  controlsContainer: {
    position: 'absolute',
    bottom: SPACING.xl,
    left: SPACING.lg,
    right: SPACING.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
  },
  toggleButton: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.primary,
    elevation: 3,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  toggleText: {
    fontWeight: TYPOGRAPHY.fontWeights.semibold,
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.white,
  },
  marker: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  markerIcon: {
    fontSize: 16,
    color: COLORS.white,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
    backgroundColor: COLORS.background,
  },
  errorTitle: {
    fontSize: TYPOGRAPHY.fontSizes.xl,
    fontWeight: TYPOGRAPHY.fontWeights.bold,
    color: COLORS.error,
    marginBottom: SPACING.md,
  },
  errorText: {
    fontSize: TYPOGRAPHY.fontSizes.base,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  errorHint: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  actionButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
    width: '80%',
    alignItems: 'center',
  },
  actionText: {
    color: COLORS.white,
    fontWeight: TYPOGRAPHY.fontWeights.semibold,
  },
  mapTypeContainer: {
    position: 'absolute',
    top: SPACING.lg,
    right: SPACING.lg,
    flexDirection: 'row',
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  mapTypeButton: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
  },
  mapTypeText: {
    fontWeight: TYPOGRAPHY.fontWeights.semibold,
    fontSize: TYPOGRAPHY.fontSizes.sm,
  },
});