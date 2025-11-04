import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location'; 
import DatabaseService from '../services/databaseService';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../constants';
const mapLabelToFilter = (label) => {
  switch (label) {
    case 'Assigned':
      return { status: 'Assigned' };
    case 'Draft':
      return { status: 'Draft' };
    case 'Completed':
      return { status: 'Completed' };
    case 'To Sync':
      return { status: 'ToSync' };
    default:
      return {};
  }
};

export default function ConsumerSelectionScreen({ navigation, route }) {
  const { section = 'Consumer Indexing', label = 'Assigned' } = route.params || {};
  const [searchQuery, setSearchQuery] = useState('');
  const [consumers, setConsumers] = useState([]);
  const [filteredConsumers, setFilteredConsumers] = useState([]);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [allConsumers, setAllConsumers] = useState([]); // Store all consumers for search
  const [isDatabaseReady, setIsDatabaseReady] = useState(false);

  const ITEMS_PER_PAGE = 10;

  // Initialize database once when the component mounts
  useEffect(() => {
    const initializeDatabase = async () => {
      try {
        const initialized = await DatabaseService.initialize();
        setIsDatabaseReady(initialized);
        if (!initialized) {
          console.error('Failed to initialize database');
          Alert.alert('Error', 'Failed to initialize database. Please try again.');
        }
      } catch (error) {
        console.error('Database initialization error:', error);
        setIsDatabaseReady(false);
        Alert.alert('Error', 'Failed to initialize database. Please try again.');
      }
    };
    initializeDatabase();
  }, [section, label]);

  // Use useFocusEffect to reload data every time the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      navigation.setOptions?.({ 
        headerShown: true, 
        title: `${section} - ${label}` 
      });
      
      if (isDatabaseReady) {
        loadConsumers(1, true); // Refresh data from the first page
        getCurrentLocation();
      }
    }, [isDatabaseReady, section, label]) // Rerun if database readiness or params change
  );

  const getCurrentLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Permission to access location was denied');
        setLocationError('Location permission denied');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setCurrentLocation(location.coords);
      setLocationError(null);
    } catch (error) {
      console.log('Error getting location:', error);
      setLocationError('Unable to get current location');
    }
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    if (lat1 === undefined || lon1 === undefined || lat2 === undefined || lon2 === undefined) return null;
    if (lat1 === null || lon1 === null || lat2 === null || lon2 === null) return null;
    
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    const d = R * c; // Distance in km
    return d;
  };

  const formatDistance = (distance) => {
    if (distance === null || distance === undefined) return 'Distance N/A';
    if (distance < 1) return `${Math.round(distance * 1000)} meters away`;
    return `${distance.toFixed(1)} KM away`;
  };

  const loadConsumers = async (pageNum = 1, isRefresh = false) => {
    if (loading && !isRefresh) return;
    
    try {
      setLoading(true);
      
      // For refresh, reset pagination
      if (isRefresh) {
        setPage(1);
        setHasMore(true);
      }
      
      const { section, label } = route.params || {};
      
      const filter = mapLabelToFilter(label);

      // Get filtered consumer indexing data from the database
      let consumersData = await DatabaseService.getConsumerIndexingData(ITEMS_PER_PAGE, (pageNum - 1) * ITEMS_PER_PAGE, filter);
      
      // Transform consumer indexing data to display format
      const consumerDisplayData = consumersData.map((consumer) => ({
          id: consumer.id,
          consumerId: consumer.CONSUMER_ID_M || `CONS${String(consumer.id).padStart(6, '0')}`,
          meterNumber: consumer.OLD_METER_SERIAL_NUMBER_M || 'N/A',
          consumerName: consumer.CONSUMER_NAME_M || consumer.consumer_name || 'Unknown Consumer',
          address: consumer.CONSUMER_ADDRESS_M || consumer.address || 'Address not available',
          latitude: consumer.LATITUDE_M || consumer.latitude || null,
          longitude: consumer.LONGITUDE_M || consumer.longitude || null,
          IndexingStatus: consumer.IndexingStatus || 'Assigned', // Ensure status exists
      }));
      
      // Store all consumers for search functionality
      // When loading paginated, we append. If refreshing, we replace.
      if (isRefresh || pageNum === 1) {
        setAllConsumers(consumerDisplayData);
      } else {
        setAllConsumers(prev => [...prev, ...consumerDisplayData]);
      }
      
      // For pagination, slice the data
      const startIndex = (pageNum - 1) * ITEMS_PER_PAGE;
      const endIndex = startIndex + ITEMS_PER_PAGE;
      const paginatedConsumers = filteredConsumers.slice(startIndex, endIndex);
      
      if (isRefresh) {
        setConsumers(consumerDisplayData);
        setFilteredConsumers(consumerDisplayData);
        setHasMore(consumerDisplayData.length === ITEMS_PER_PAGE);
      } else {
        // For initial load or when loading more, replace consumers with paginated data
        // This ensures we don't duplicate data when refreshing
        setConsumers(prev => (pageNum === 1 ? consumerDisplayData : [...prev, ...consumerDisplayData]));
        setFilteredConsumers(prev => (pageNum === 1 ? consumerDisplayData : [...prev, ...consumerDisplayData]));
        setHasMore(consumerDisplayData.length === ITEMS_PER_PAGE);
      }
      
    } catch (error) {
      console.error('Failed to load consumers:', error);
      Alert.alert('Error', 'Failed to load consumer data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadMoreConsumers = () => {
    if (!loading && hasMore && isDatabaseReady) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadConsumers(nextPage);
    }
  };

  const onRefresh = useCallback(() => {
    if (!isDatabaseReady) {
      console.log('Database not ready, skipping refresh');
      return;
    }
    
    setRefreshing(true);
    loadConsumers(1, true);
  }, [isDatabaseReady]);

  const handleSearch = (query) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      // Reset to paginated view
      setFilteredConsumers(consumers);
      return;
    }
    
    // Search through all consumers, not just the currently loaded ones
    const lowerQuery = query.toLowerCase();
    const filtered = allConsumers.filter(consumer => 
      consumer.consumerId.toLowerCase().includes(lowerQuery) ||
      consumer.meterNumber.toLowerCase().includes(lowerQuery) ||
      consumer.consumerName.toLowerCase().includes(lowerQuery)
    );
    
    // For search results, show all matching items (no pagination)
    setFilteredConsumers(filtered);
  };

  const handleConsumerSelect = (consumer) => {
    // Navigate to the detailed form screen
    if (consumer.isDraft) {
      // For draft records, we might want to implement edit functionality
      // For now, we'll just show an alert
      Alert.alert(
        'Draft Record',
        'This is a draft record. Edit functionality would be implemented here.',
        [{ text: 'OK' }]
      );
    } else {
      navigation.navigate('ConsumerIndexingForm', {
        consumerId: consumer.consumerId,
        consumerName: consumer.consumerName,
        indexingStatus: consumer.IndexingStatus || 'Assigned'
      });
    }
  };

  const renderConsumerItem = ({ item }) => {
    const distance = currentLocation
      ? calculateDistance(
          currentLocation.latitude,
          currentLocation.longitude,
          item.latitude,
          item.longitude
        )
      : null;

    const distanceText = distance !== null ? formatDistance(distance) : 'Distance N/A';

    return (
      <TouchableOpacity
        style={styles.consumerItem}
        onPress={() => handleConsumerSelect(item)}
      >
        <View style={styles.consumerInfo}>
          <Text style={styles.consumerId}>{item.consumerId}</Text>
          <Text style={styles.meterNumber}>{item.meterNumber}</Text>
          <Text style={styles.consumerName}>{item.consumerName}</Text>
        </View>
        <View style={styles.distanceContainer}>
          <Text style={styles.distanceText}>{distanceText}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderFooter = () => {
    if (!loading) return null;
    return (
      <View style={styles.footerLoader}>
        <Text>Loading more consumers...</Text>
      </View>
    );
  };

  const renderHeader = () => (
    <View>
      <View style={{ paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm }}>
        <Text style={{ color: COLORS.textSecondary, fontSize: TYPOGRAPHY.fontSizes.sm }}>
          Showing {filteredConsumers.length} of {allConsumers.length} consumers
        </Text>
      </View>
      {locationError && (
        <View style={{ 
          backgroundColor: '#FFF3CD', 
          padding: SPACING.md, 
          marginHorizontal: SPACING.md,
          borderRadius: BORDER_RADIUS.md,
          marginBottom: SPACING.sm
        }}>
          <Text style={{ color: '#856404', fontSize: TYPOGRAPHY.fontSizes.sm }}>
            {locationError}. Distance will show as "N/A". Tap to retry.
          </Text>
          <TouchableOpacity onPress={getCurrentLocation} style={{ marginTop: SPACING.xs }}>
            <Text style={{ color: '#1976D2', fontWeight: '600' }}>Retry Location</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons 
            name="search" 
            size={20} 
            color={COLORS.textSecondary} 
            style={styles.searchIcon} 
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by Consumer ID or Meter Number"
            value={searchQuery}
            onChangeText={handleSearch}
            placeholderTextColor={COLORS.textSecondary}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => handleSearch('')}>
              <Ionicons 
                name="close-circle" 
                size={20} 
                color={COLORS.textSecondary} 
                style={styles.clearIcon} 
              />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <FlatList
        data={filteredConsumers}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderConsumerItem}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons 
              name="person-outline" 
              size={48} 
              color={COLORS.textSecondary} 
            />
            <Text style={styles.emptyText}>No consumers found</Text>
            <Text style={styles.emptySubtext}>
              Try adjusting your search criteria
            </Text>
          </View>
        }
        onEndReached={loadMoreConsumers}
        onEndReachedThreshold={0.1}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  searchContainer: {
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBackground,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
  },
  searchIcon: {
    marginRight: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: SPACING.md,
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSizes.md,
  },
  clearIcon: {
    marginLeft: SPACING.sm,
  },
  listContent: {
    paddingVertical: SPACING.sm,
  },
  consumerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.md,
    marginVertical: SPACING.xs,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    elevation: 1,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  consumerInfo: {
    flex: 1,
  },
  consumerId: {
    fontSize: TYPOGRAPHY.fontSizes.lg,
    fontWeight: TYPOGRAPHY.fontWeights.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  meterNumber: {
    fontSize: TYPOGRAPHY.fontSizes.md,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  consumerName: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.textSecondary,
  },
  distanceContainer: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.surface,
  },
  distanceText: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    fontWeight: TYPOGRAPHY.fontWeights.medium,
    color: COLORS.primary,
  },
  footerLoader: {
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: TYPOGRAPHY.fontSizes.lg,
    fontWeight: TYPOGRAPHY.fontWeights.semibold,
    color: COLORS.textPrimary,
    marginTop: SPACING.md,
  },
  emptySubtext: {
    fontSize: TYPOGRAPHY.fontSizes.md,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
});