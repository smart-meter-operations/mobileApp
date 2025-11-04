import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Platform, ActivityIndicator, Alert } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants';

// Calculates a region that encompasses all given coordinates
function getRegionForCoordinates(points) {
  let minX, maxX, minY, maxY;

  ((point) => {
    minX = point.latitude;
    maxX = point.latitude;
    minY = point.longitude;
    maxY = point.longitude;
  })(points[0]);

  points.forEach(point => {
    minX = Math.min(minX, point.latitude);
    maxX = Math.max(maxX, point.latitude);
    minY = Math.min(minY, point.longitude);
    maxY = Math.max(maxY, point.longitude);
  });

  const midX = (minX + maxX) / 2;
  const midY = (minY + maxY) / 2;
  const deltaX = (maxX - minX) * 1.5; // 1.5 factor for padding
  const deltaY = (maxY - minY) * 1.5;

  return {
    latitude: midX,
    longitude: midY,
    latitudeDelta: deltaX,
    longitudeDelta: deltaY,
  };
}

export default function TraceMapScreen({ route, navigation }) {
  const { user } = route.params;
  const [origin, setOrigin] = useState(null);
  const [region, setRegion] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Permission to access location was denied.');
        setLoading(false);
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      const currentOrigin = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      };
      setOrigin(currentOrigin);

      // Calculate the region to fit both points
      const destination = user.coordinate;
      const calculatedRegion = getRegionForCoordinates([currentOrigin, destination]);
      setRegion(calculatedRegion);

      setLoading(false);
    })();
  }, [user.coordinate]);

  const handleStartJourney = () => {
    const scheme = Platform.select({ ios: 'maps:0,0?q=', android: 'geo:0,0?q=' });
    const latLng = `${user.coordinate.latitude},${user.coordinate.longitude}`;
    const label = user.name;
    const url = Platform.select({
      ios: `${scheme}${label}@${latLng}`,
      android: `${scheme}${latLng}(${label})`
    });
    Linking.openURL(url);
  };

  if (loading || !region) {
    return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
  }

  if (!origin) {
    return <View style={styles.center}><Text>Could not determine your location.</Text></View>;
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={region}
      >
        <Marker coordinate={origin} title="Your Location" pinColor={COLORS.primary} />
        <Marker coordinate={user.coordinate} title={user.name} />
        <Polyline coordinates={[origin, user.coordinate]} strokeColor={COLORS.primary} strokeWidth={3} />
      </MapView>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color={COLORS.white} />
        </TouchableOpacity>
      </View>
      <View style={styles.bottomCard}>
        <Text style={styles.cardTitle}>{user.name}</Text>
        <Text style={styles.cardAddress}>{user.address}</Text>
        <TouchableOpacity style={styles.journeyButton} onPress={handleStartJourney}>
          <Ionicons name="navigate" size={22} color={COLORS.white} />
          <Text style={styles.buttonText}>Start Map Journey</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { ...StyleSheet.absoluteFillObject },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    position: 'absolute',
    top: SPACING.xl + 10,
    left: SPACING.lg,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 25,
    padding: 5,
  },
  bottomCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    padding: SPACING.lg,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 10,
  },
  cardTitle: {
    fontSize: TYPOGRAPHY.fontSizes.xl,
    fontWeight: TYPOGRAPHY.fontWeights.bold,
    marginBottom: SPACING.xs,
  },
  cardAddress: {
    fontSize: TYPOGRAPHY.fontSizes.md,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
  },
  journeyButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSizes.md,
    fontWeight: TYPOGRAPHY.fontWeights.bold,
    marginLeft: SPACING.sm,
  },
});
