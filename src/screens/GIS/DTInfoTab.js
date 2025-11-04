import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Platform, Linking } from 'react-native';
import * as IntentLauncher from 'expo-intent-launcher';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { dummyDTs, dummyPowerLines, dummySubstations, dummyFeeders } from './dummydata';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants';

const DT_ICON_SIZE = 40;

const CustomMarker = ({ coordinate, name, icon, color }) => (
  <Marker coordinate={coordinate} title={name}>
    <View style={[styles.markerContainer, { backgroundColor: color }]}>
      <Ionicons name={icon} size={20} color={COLORS.white} />
    </View>
  </Marker>
);

export default function DTInfoTab() {
  const [loading, setLoading] = useState(false);
  const mapRef = useRef(null);

  const handleNearbyPress = async () => {
    setLoading(true);
    try {
      // First, check if location services are enabled
      const isLocationEnabled = await Location.hasServicesEnabledAsync();
      if (!isLocationEnabled) {
        Alert.alert(
          'Location Services Disabled',
          'Please enable location services in your device settings and try again.',
          [
            {
              text: 'Open Settings',
              onPress: () => {
                if (Platform.OS === 'ios') {
                  Linking.openURL('app-settings:');
                } else {
                  IntentLauncher.startActivityAsync(IntentLauncher.ACTION_LOCATION_SOURCE_SETTINGS);
                }
              },
            },
            { text: 'Cancel' },
          ]
        );
        return;
      }

      // Request location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Location permission is required to show nearby DTs. Please enable it in your device settings.',
          [
            {
              text: 'Open Settings',
              onPress: () => {
                if (Platform.OS === 'ios') {
                  Linking.openURL('app-settings:');
                } else {
                  IntentLauncher.startActivityAsync(IntentLauncher.ACTION_APPLICATION_DETAILS_SETTINGS);
                }
              },
            },
            { text: 'Cancel' },
          ]
        );
        return;
      }

      // Get current position with timeout and high accuracy
      const location = await Promise.race([
        Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
          timeInterval: 5000,
          distanceInterval: 10,
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Location request timed out')), 10000)
        ),
      ]);

      const { latitude, longitude } = location.coords;

      // Animate to the user's location with a small delay to ensure map is ready
      setTimeout(() => {
        if (mapRef.current) {
          try {
            const center = { latitude, longitude };
            mapRef.current.animateCamera(
              { center, zoom: 15, pitch: 0, heading: 0 },
              { duration: 1000 }
            );
          } catch (mapError) {
            console.error('Map animation error:', mapError);
          }
        } else {
          console.warn('Map ref not available for animation');
        }
      }, 500); // Small delay to ensure map is fully loaded

      // Show success message
      Alert.alert(
        'Location Found',
        `Your location: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
        [{ text: 'OK' }]
      );

    } catch (error) {
      console.error('Location Error:', error);
      let errorMessage = 'Could not fetch your location. ';

      if (error.message.includes('permission')) {
        errorMessage += 'Location permission was denied.';
      } else if (error.message.includes('time out')) {
        errorMessage += 'Location request timed out. Please try again.';
      } else if (error.message.includes('network')) {
        errorMessage += 'Network error occurred. Please check your connection.';
      } else {
        errorMessage += 'Please try again later.';
      }

      Alert.alert('Location Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Set the map view reference when the map is ready
  const onMapReady = () => {
    // Map is ready for use
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        onMapReady={onMapReady}
        style={styles.map}
        initialRegion={{
          latitude: 18.5204,
          longitude: 73.8567,
          latitudeDelta: 0.2,
          longitudeDelta: 0.2,
        }}
        onLayout={onMapReady}
      >
        {dummyPowerLines.map(line => (
          <Polyline
            key={line.id}
            coordinates={line.coordinates}
            strokeColor={COLORS.primary} // Professional blue color
            strokeWidth={3}
          />
        ))}
        {dummyDTs.map(dt => (
          <CustomMarker key={dt.id} coordinate={dt.coordinate} name={dt.name} icon="flash" color={COLORS.primary} />
        ))}
        {dummySubstations.map(ss => (
          <CustomMarker key={ss.id} coordinate={ss.coordinate} name={ss.name} icon="business" color={COLORS.success} />
        ))}
        {dummyFeeders.map(feeder => (
          <CustomMarker key={feeder.id} coordinate={feeder.coordinate} name={feeder.name} icon="git-merge" color={COLORS.warning} />
        ))}
      </MapView>
      <TouchableOpacity style={styles.nearbyButton} onPress={handleNearbyPress} disabled={loading}>
        {loading ? (
          <ActivityIndicator color={COLORS.white} />
        ) : (
          <>
            <Ionicons name="navigate-circle-outline" size={24} color={COLORS.white} />
            <Text style={styles.buttonText}>Nearby DTs</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  nearbyButton: {
    position: 'absolute',
    bottom: SPACING.lg,
    left: SPACING.lg,
    right: SPACING.lg,
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSizes.md,
    fontWeight: TYPOGRAPHY.fontWeights.bold,
    marginLeft: SPACING.sm,
  },
  markerContainer: {
    backgroundColor: COLORS.primary,
    width: DT_ICON_SIZE,
    height: DT_ICON_SIZE,
    borderRadius: DT_ICON_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: COLORS.white,
    borderWidth: 2,
    elevation: 5,
  },
});
