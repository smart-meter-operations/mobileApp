// c:/Swapnil/Qoder Projects/SMOV0.1/src/screens/GIS/GISScreen.js

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Linking, ScrollView } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import DatabaseService from '../../services/databaseService';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants';

// Helper to get marker color based on status
const getMarkerColor = (status) => {
  switch (status) {
    case 'Completed':
      return COLORS.success;
    case 'Assigned':
      return COLORS.warning;
    case 'ToSync':
      return COLORS.info;
    default:
      return COLORS.gray;
  }
};

const GISScreen = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('DT Info');
  const [consumers, setConsumers] = useState([]);
  const [substations, setSubstations] = useState([]);
  const [feeders, setFeeders] = useState([]);
  const [dtrData, setDtrData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [isMapReady, setIsMapReady] = useState(false); // <-- Add this state
  const [selectedConsumer, setSelectedConsumer] = useState(null);
  const mapRef = useRef(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const consumerData = await DatabaseService.getConsumerIndexingData(100, 0, { status: 'Assigned' });
      const consumersWithCoords = consumerData.filter(c => c.LATITUDE_M && c.LONGITUDE_M).map(c => ({
        id: c.CONSUMER_ID_M,
        name: c.CONSUMER_NAME_M,
        address: c.CONSUMER_ADDRESS_M,
        status: c.IndexingStatus,
        coordinate: {
          latitude: parseFloat(c.LATITUDE_M),
          longitude: parseFloat(c.LONGITUDE_M),
        },
      }));
      setConsumers(consumersWithCoords);

      const dtrInfo = await DatabaseService.getDtrData();
      let dtrWithCoords = dtrInfo.filter(d => d.latitude && d.longitude).map(d => ({
        ...d,
        coordinate: {
          latitude: parseFloat(d.latitude),
          longitude: parseFloat(d.longitude),
        },
      }));
      // If no DTR data found in DB, use dummy data around Nagpur
      const nagpur = { lat: 21.1458, lon: 79.0882 };
      if (dtrWithCoords.length === 0) {
        const dummyDtrs = [
          { dtr_code: 'DTR-NGP-001', dtr_name: 'Nagpur Suburban DTR-1', latitude: String(nagpur.lat + 0.0102), longitude: String(nagpur.lon - 0.0061) },
          { dtr_code: 'DTR-NGP-002', dtr_name: 'Nagpur Urban DTR-2', latitude: String(nagpur.lat - 0.0088), longitude: String(nagpur.lon + 0.0075) },
          { dtr_code: 'DTR-NGP-003', dtr_name: 'Hingna Road DTR-3', latitude: String(nagpur.lat + 0.0150), longitude: String(nagpur.lon + 0.0110) },
          { dtr_code: 'DTR-NGP-004', dtr_name: 'Sitabuldi DTR-4', latitude: String(nagpur.lat - 0.0120), longitude: String(nagpur.lon - 0.0125) },
          { dtr_code: 'DTR-NGP-005', dtr_name: 'Koradi Road DTR-5', latitude: String(nagpur.lat + 0.0065), longitude: String(nagpur.lon + 0.0172) },
        ];
        dtrWithCoords = dummyDtrs.map(d => ({
          ...d,
          coordinate: { latitude: parseFloat(d.latitude), longitude: parseFloat(d.longitude) },
        }));
      }
      setDtrData(dtrWithCoords);

      // Always provide dummy Substations and Feeders near Nagpur for demo visibility
      const dummySubstations = [
        { code: 'SS-NGP-01', name: 'Nagpur North Substation', latitude: nagpur.lat + 0.005, longitude: nagpur.lon + 0.004 },
        { code: 'SS-NGP-02', name: 'Nagpur South Substation', latitude: nagpur.lat - 0.006, longitude: nagpur.lon - 0.003 },
      ];
      const dummyFeeders = [
        { code: 'FDR-NGP-101', name: 'Koradi Feeder', latitude: nagpur.lat + 0.012, longitude: nagpur.lon + 0.002 },
        { code: 'FDR-NGP-102', name: 'Sitabuldi Feeder', latitude: nagpur.lat - 0.011, longitude: nagpur.lon - 0.004 },
        { code: 'FDR-NGP-103', name: 'Hingna Feeder', latitude: nagpur.lat + 0.007, longitude: nagpur.lon - 0.009 },
      ];
      setSubstations(dummySubstations.map(s => ({
        ...s,
        coordinate: { latitude: s.latitude, longitude: s.longitude },
      })));
      setFeeders(dummyFeeders.map(f => ({
        ...f,
        coordinate: { latitude: f.latitude, longitude: f.longitude },
      })));

    } catch (err) {
      setError('Failed to load data from the database.');
      console.error('GISScreen data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const requestLocation = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setError('Permission to access location was denied');
      return;
    }

    try {
      let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });
    } catch (locationError) {
      console.error("Error getting current location:", locationError);
      setError("Could not fetch current location.");
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
      requestLocation();
    }, [])
  );

  const handleMarkerPress = (item) => {
    Alert.alert(
      item.name,
      `Status: ${item.status}\nAddress: ${item.address || 'N/A'}`,
      [
        { text: 'OK' },
        {
          text: 'View Details',
          onPress: () => navigation.navigate('ConsumerIndexingForm', { consumerId: item.id, consumerName: item.name, indexingStatus: item.status }),
        },
      ]
    );
  };

  const handleDtrPress = (dtr) => {
    if (mapRef.current && isMapReady) { // <-- Check if map is ready
      const coords = [
        { latitude: dtr.coordinate.latitude, longitude: dtr.coordinate.longitude },
      ];
      try {
        mapRef.current.fitToCoordinates(coords, {
          edgePadding: { top: 80, right: 80, bottom: 80, left: 80 },
          animated: true,
        });
      } catch (e) {
        console.error("Location Error:", e);
        Alert.alert("Map Error", "Could not animate to the selected location.");
      }
    } else {
      console.warn("Map is not ready for animation.");
    }
  };

  const toRad = (value) => (value * Math.PI) / 180;
  const haversineDistanceKm = (loc1, loc2) => {
    if (!loc1 || !loc2) return null;
    const R = 6371; // km
    const dLat = toRad(loc2.latitude - loc1.latitude);
    const dLon = toRad(loc2.longitude - loc1.longitude);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(loc1.latitude)) *
        Math.cos(toRad(loc2.latitude)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const handleConsumerPress = (consumer) => {
    setSelectedConsumer(consumer);
    if (mapRef.current && isMapReady) {
      const coords = userLocation
        ? [
            { latitude: userLocation.latitude, longitude: userLocation.longitude },
            { latitude: consumer.coordinate.latitude, longitude: consumer.coordinate.longitude },
          ]
        : [
            { latitude: consumer.coordinate.latitude, longitude: consumer.coordinate.longitude },
          ];
      try {
        mapRef.current.fitToCoordinates(coords, {
          edgePadding: { top: 80, right: 80, bottom: 80, left: 80 },
          animated: true,
        });
      } catch (e) {
        console.error('Map animate error:', e);
      }
    }
  };

  const startJourney = (consumer) => {
    if (!consumer || !userLocation) return;
    const dest = `${consumer.coordinate.latitude},${consumer.coordinate.longitude}`;
    const origin = `${userLocation.latitude},${userLocation.longitude}`;
    const url = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(dest)}&travelmode=driving`;
    Linking.openURL(url).catch(() => Alert.alert('Navigation Error', 'Unable to open Google Maps.'));
  };

  const renderContent = () => {
    if (loading) {
      return <ActivityIndicator size="large" color={COLORS.primary} style={styles.centered} />;
    }
    if (error) {
      return <Text style={[styles.centered, styles.errorText]}>{error}</Text>;
    }
    if (activeTab === 'DT Info') {
      return (
        <ScrollView style={styles.listContainer} contentContainerStyle={styles.scrollContent}>
          <Text style={styles.sectionHeader}>Substations</Text>
          {substations.map(ss => (
            <TouchableOpacity key={ss.code} style={styles.listItem} onPress={() => handleDtrPress({ coordinate: ss.coordinate })}>
              <Ionicons name="flash-outline" size={24} color={COLORS.success} />
              <View style={styles.listItemTextContainer}>
                <Text style={styles.listItemTitle}>{ss.name}</Text>
                <Text style={styles.listItemSubtitle}>{ss.code}</Text>
              </View>
            </TouchableOpacity>
          ))}
          <Text style={styles.sectionHeader}>Feeders</Text>
          {feeders.map(fd => (
            <TouchableOpacity key={fd.code} style={styles.listItem} onPress={() => handleDtrPress({ coordinate: fd.coordinate })}>
              <Ionicons name="flash-outline" size={24} color={COLORS.info} />
              <View style={styles.listItemTextContainer}>
                <Text style={styles.listItemTitle}>{fd.name}</Text>
                <Text style={styles.listItemSubtitle}>{fd.code}</Text>
              </View>
            </TouchableOpacity>
          ))}
          <Text style={styles.sectionHeader}>DTRs</Text>
          {dtrData.map(dtr => (
            <TouchableOpacity key={dtr.dtr_code} style={styles.listItem} onPress={() => handleDtrPress(dtr)}>
              <Ionicons name="flash-outline" size={24} color={COLORS.primary} />
              <View style={styles.listItemTextContainer}>
                <Text style={styles.listItemTitle}>{dtr.dtr_name}</Text>
                <Text style={styles.listItemSubtitle}>{dtr.dtr_code}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      );
    }
    if (activeTab === 'Assigned Consumers') {
      return (
        <ScrollView style={styles.listContainer} contentContainerStyle={styles.scrollContent}>
          {consumers.map(c => {
            const dist = userLocation ? haversineDistanceKm(
              { latitude: userLocation.latitude, longitude: userLocation.longitude },
              c.coordinate
            ) : null;
            const distText = dist != null ? `${dist.toFixed(2)} km` : 'N/A';
            return (
              <TouchableOpacity key={c.id} style={styles.listItem} onPress={() => handleConsumerPress(c)}>
                <Ionicons name="person-outline" size={24} color={COLORS.primary} />
                <View style={styles.listItemTextContainer}>
                  <Text style={styles.listItemTitle}>{c.name || c.id}</Text>
                  <Text style={styles.listItemSubtitle}>Distance: {distText}</Text>
                </View>
                <View style={{ marginLeft: 'auto' }}>
                  <TouchableOpacity onPress={() => startJourney(c)} style={styles.startBtn}>
                    <Text style={styles.startBtnText}>Start Journey</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      );
    }
    return null;
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={userLocation || { latitude: 21.1458, longitude: 79.0882, latitudeDelta: 0.05, longitudeDelta: 0.05 }}
        showsUserLocation
        onMapReady={() => setIsMapReady(true)} // <-- Set map ready state
      >
        {consumers.map(consumer => (
          <Marker
            key={consumer.id}
            coordinate={consumer.coordinate}
            title={consumer.name}
            description={`Status: ${consumer.status}`}
            pinColor={getMarkerColor(consumer.status)}
            onCalloutPress={() => handleMarkerPress(consumer)}
          />
        ))}
        {selectedConsumer && userLocation && (
          <Polyline
            coordinates={[
              { latitude: userLocation.latitude, longitude: userLocation.longitude },
              { latitude: selectedConsumer.coordinate.latitude, longitude: selectedConsumer.coordinate.longitude },
            ]}
            strokeColor={COLORS.primary}
            strokeWidth={3}
          />
        )}
        {substations.map(ss => (
          <Marker
            key={`ss-${ss.code}`}
            coordinate={ss.coordinate}
            title={ss.name}
            description={ss.code}
          >
            <Ionicons name="flash" size={30} color={COLORS.success} />
          </Marker>
        ))}
        {feeders.map(fd => (
          <Marker
            key={`fd-${fd.code}`}
            coordinate={fd.coordinate}
            title={fd.name}
            description={fd.code}
          >
            <Ionicons name="flash" size={28} color={COLORS.info} />
          </Marker>
        ))}
        {dtrData.map(dtr => (
          <Marker
            key={`dtr-${dtr.dtr_code}`}
            coordinate={dtr.coordinate}
            title={dtr.dtr_name}
            description={dtr.dtr_code}
          >
            <Ionicons name="flash" size={30} color={COLORS.warning} />
          </Marker>
        ))}
      </MapView>
      <View style={styles.bottomSheet}>
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'DT Info' && styles.activeTab]}
            onPress={() => setActiveTab('DT Info')}
          >
            <Text style={[styles.tabText, activeTab === 'DT Info' && styles.activeTabText]}>DT Info</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'Assigned Consumers' && styles.activeTab]}
            onPress={() => setActiveTab('Assigned Consumers')}
          >
            <Text style={[styles.tabText, activeTab === 'Assigned Consumers' && styles.activeTabText]}>Assigned Consumers</Text>
          </TouchableOpacity>
        </View>
        {renderContent()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.lg,
    maxHeight: '50%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  activeTabText: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  listContainer: {
    flex: 1,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  listItemTextContainer: {
    marginLeft: SPACING.md,
  },
  listItemTitle: {
    ...TYPOGRAPHY.body,
    fontWeight: 'bold',
  },
  listItemSubtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  sectionHeader: {
    ...TYPOGRAPHY.subtitle,
    color: COLORS.textPrimary,
    marginTop: SPACING.xs,
    marginBottom: SPACING.xs,
    fontWeight: 'bold',
  },
  startBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  startBtnText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: COLORS.error,
    ...TYPOGRAPHY.body,
  },
});

export default GISScreen;
