import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StatusBar,
  Animated,
  Alert,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

// Import components and services
import {
  StatsCard,
  Button,
  BottomNavigation,
  AnimatedUserHeader,
  MapModal,
  QuickActionButton,
  PerformanceMetrics,
  RecentActivities
} from '../components';
import { DataService, NetworkService } from '../services';
import DatabaseService from '../services/databaseService';
import { performManualSync } from '../utils/syncUtils';
import { insertDummyData, clearAllData } from '../utils/insertDummyData';
import {
  useEntranceAnimation,
  useStaggeredAnimation,
  useScaleAnimation,
  useAsyncOperation,
} from '../hooks';
import { dashboardStyles } from '../styles';
import { COLORS, STATUS } from '../constants';

export default function DashboardScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('Home');
  const [dashboardData, setDashboardData] = useState({
    stats: null,
    installations: [],
    user: null,
  });
  const [counters, setCounters] = useState(null);
  const [syncStatus, setSyncStatus] = useState('online');
  const [showMapModal, setShowMapModal] = useState(false);
  const [mapConsumerLocation, setMapConsumerLocation] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDbReady, setIsDbReady] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0); // sync queue count (internal)

  // Custom hooks
  const { animatedStyle } = useEntranceAnimation();
  const cardAnims = useStaggeredAnimation(4, 150);
  const { animatedStyle: buttonAnimatedStyle, animatePress } =
    useScaleAnimation();
  const { loading, execute } = useAsyncOperation();

  // Initialize services once on component mount
  useEffect(() => {
    if (!isDbReady) {
      initializeServices();
    }
  }, []);

  // Use useFocusEffect to reload data every time the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (isDbReady) loadDashboardData();
    }, [isDbReady])
  );

  const initializeServices = async () => {
    try {
      // Initialize database service first
      const inited = await DatabaseService.initialize();
      if (!inited) {
        console.warn('Database not initialized');
        setIsDbReady(false);
      }

      // Initialize network service and monitor connection
      const networkResult = await NetworkService.initialize();
      if (networkResult.success) {
        // Add network listener to update sync status
        NetworkService.addNetworkListener((networkState) => {
          setSyncStatus(
            networkState.isConnected && networkState.isInternetReachable
              ? 'online'
              : 'offline'
          );
        });
      } else {
        setIsDbReady(true);
      }
    } catch (error) {
      console.error('Initialize services failed:', error);
    }
  };

  const loadDashboardData = async () => {
    try {
      await execute(async () => {
        const [stats, installations, user, kpis, queueCount] = await Promise.all([
          DataService.getDashboardStats(),
          DataService.getInstallationList(),
          DataService.getUserProfile(),
          DataService.getDashboardCounters(),
          DatabaseService.getSyncQueueCount(),
        ]);

        setDashboardData({ stats, installations, user });
        setCounters(kpis);
        setPendingCount(queueCount || 0);
      });
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const handleCardPress = (cardType) => {
    console.log(`${cardType} card pressed`);
    // In future, navigate to specific screens
  };

  const handleListItemPress = (item) => {
    console.log('List item pressed:', item.name);
    // Show map modal with the selected consumer's location
    if (item.coordinates) {
      setMapConsumerLocation({
        latitude: item.coordinates.lat,
        longitude: item.coordinates.lng,
        name: item.name,
        address: item.address
      });
      setShowMapModal(true);
    }
  };

  const handleMapTabPress = () => {
    // Show map modal without a specific consumer location
    setMapConsumerLocation(null);
    setShowMapModal(true);
  };

  const handleConsumerIndexingPress = (label) => {
    navigation.navigate('TasksList', { section: 'Consumer Indexing', label });
  };

  const handleNewInstallation = () => {
    animatePress();
    console.log('New installation pressed');
    // In future, navigate to create task screen
  };

  const handleUserIconPress = () => {
    navigation.navigate('UserProfileScreen');
  };

  const handleGlobalSync = async () => {
    if (isSyncing) return;

    setIsSyncing(true);
    setSyncStatus('syncing');
    let successCount = 0;
    let failCount = 0;

    try {
      const recordsToSync = await DatabaseService.getConsumerIndexingData({ status: 'ToSync' });
      if (recordsToSync.length === 0) {
        Alert.alert('Sync', 'No records are pending synchronization.');
        return;
      }

      for (const record of recordsToSync) {
        // Map DB record to the structure expected by the submission function
        const formLikeRecord = {
          ...record, // Pass all original fields
          consumerId: record.CONSUMER_ID_M,
          // Add any other necessary mappings here if buildMappedPayload needs them
        };

        const result = await submitConsumerSurveyGroup(formLikeRecord);
        if (result.success) {
          await DatabaseService.updateConsumerIndexingStatus(record.CONSUMER_ID_M, 'Completed');
          successCount++;
        } else {
          failCount++;
        }
      }

      await loadDashboardData(); // Refresh data

      Alert.alert(
        'Global Sync Complete',
        `Successfully synced: ${successCount}\nFailed: ${failCount}`,
        [{ text: 'OK' }]
      );

    } catch (error) {
      console.error('Global Sync Error:', error);
      console.error('Sync Error', 'An unexpected error occurred during global synchronization.');
    } finally {
      setIsSyncing(false);
      const left = await DatabaseService.getSyncQueueCount();
      setPendingCount(left || 0);
    }
  };

  // Function to insert dummy data
  const handleInsertDummyData = async () => {
    try {
      const result = await insertDummyData();
      if (result.success) {
        Alert.alert(
          'Success',
          'Dummy data inserted successfully!',
          [{ text: 'OK', onPress: () => loadDashboardData() }]
        );
      } else {
        console.error(
          'Error',
          result.error || 'Failed to insert dummy data.'
        );
      }
    } catch (error) {
      console.error(
        'Error',
        error.message || 'An error occurred while inserting dummy data.'
      );
    }
  };

  // Function to clear all data
  const handleClearData = async () => {
    try {
      const result = await clearAllData();
      if (result.success) {
        Alert.alert(
          'Success',
          'All data cleared successfully!',
          [{ text: 'OK', onPress: () => loadDashboardData() }]
        );
      } else {
        console.error(
          'Error',
          result.error || 'Failed to clear data.'
        );
      }
    } catch (error) {
      console.error(
        'Error',
        error.message || 'An error occurred while clearing data.'
      );
    }
  };

  // Quick action handlers
  const handleQuickAction = (action) => {
    console.log(`Quick action pressed: ${action}`);
    // Implement specific actions here
  };

  const tabs = [
    { name: 'Home', title: 'Home', icon: 'home-outline' },
    { name: 'Masterdata', title: 'Masterdata', icon: 'folder-open-outline' },
    { name: 'GIS', title: 'GIS', icon: 'map-outline' },
    { name: 'Capture', title: 'Capture', icon: 'camera-outline' },
  ];

  const { stats, installations, user } = dashboardData;

  // Mock data for performance metrics
  const performanceMetrics = [
    { label: 'Survey Completion', value: '85%', percentage: 85, color: COLORS.success },
    { label: 'Installation Rate', value: '92%', percentage: 92, color: COLORS.primary },
    { label: 'On-time Delivery', value: '78%', percentage: 78, color: COLORS.warning },
    { label: 'Customer Satisfaction', value: '96%', percentage: 96, color: COLORS.info },
  ];

  // Mock data for recent activities
  const recentActivities = [
    { 
      icon: 'construct-outline', 
      title: 'Installation Completed', 
      description: 'Transformer Substation TS-01', 
      time: '2 hours ago',
      color: COLORS.successLight
    },
    { 
      icon: 'list-outline', 
      title: 'Survey Submitted', 
      description: 'Distribution Feeder DF-15', 
      time: '5 hours ago',
      color: COLORS.infoLight
    },
    { 
      icon: 'camera-outline', 
      title: 'Photo Captured', 
      description: 'Utility Pole UP-221', 
      time: '1 day ago',
      color: COLORS.primaryLight
    },
    { 
      icon: 'warning-outline', 
      title: 'Issue Reported', 
      description: 'Cable Laying CL-05', 
      time: '1 day ago',
      color: COLORS.warningLight
    },
  ];

  return (
    <View style={dashboardStyles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={COLORS.background}
        translucent={false}
      />
      <SafeAreaView style={dashboardStyles.safeArea}>
        <Animated.View style={[dashboardStyles.content, animatedStyle]}>
          {/* Animated User Header */}
          <AnimatedUserHeader
            user={user}
            onUserIconPress={handleUserIconPress}
            syncStatus={isSyncing ? 'syncing' : syncStatus}
            pendingItems={counters?.consumerIndexing?.toSync ?? 0}
            onSyncNow={handleGlobalSync}
          />

          <ScrollView
            showsVerticalScrollIndicator={false}
            style={dashboardStyles.scrollContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            contentContainerStyle={{ paddingBottom: 0 }}
          >
            {/* Total Completed Card */}
            <View style={{ marginHorizontal: 12, marginTop: 8 }}>
              <View style={{ backgroundColor: COLORS.borderLight, borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.gray + '20', alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                  <Ionicons name="speedometer-outline" size={20} color={COLORS.textSecondary} />
                </View>
                <View>
                  <Text style={{ color: COLORS.textSecondary, fontSize: 12 }}>Total Completed</Text>
                  <Text style={{ color: COLORS.textPrimary, fontSize: 20, fontWeight: '700' }}>{counters?.totalCompleted ?? 0}</Text>
                </View>
              </View>
            </View>

            {/* Consumer Indexing Section */}
            <Text style={[dashboardStyles.sectionTitle, { marginHorizontal: 12, marginTop: 10, fontSize: 13 }]}>Consumer Indexing</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 8 }}>
              {[
                { label: 'Assigned', value: counters?.consumerIndexing?.assigned ?? 0, icon: 'person-outline' },
                { label: 'Draft', value: counters?.consumerIndexing?.draft ?? 0, icon: 'document-outline' },
                { label: 'Completed', value: counters?.consumerIndexing?.completed ?? 0, icon: 'checkmark-done-outline' },
                { label: 'To Sync', value: counters?.consumerIndexing?.toSync ?? 0, icon: 'sync-outline' },
              ].map((item) => (
                <View key={`ci-${item.label}`} style={{ width: '50%', padding: 6 }}>
                  <TouchableOpacity 
                    activeOpacity={0.8} 
                    onPress={() => handleConsumerIndexingPress(item.label)}
                    style={{ backgroundColor: COLORS.surface, borderRadius: 12, padding: 12 }}
                  >
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <Text style={{ color: COLORS.textSecondary, fontSize: 11 }}>{item.label}</Text>
                      <Ionicons name={item.icon} size={16} color={COLORS.gray} />
                    </View>
                    <Text style={{ fontSize: 20, fontWeight: '700', color: COLORS.textPrimary }}>{item.value}</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            {/* Meter Installation Section */}
            <Text style={[dashboardStyles.sectionTitle, { marginHorizontal: 12, marginTop: 10, fontSize: 13 }]}>Meter Installation</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 8, marginBottom: 10 }}>
              {[
                { label: 'Assigned', value: counters?.meterInstallation?.assigned ?? 0, icon: 'list-outline' },
                { label: 'Draft', value: counters?.meterInstallation?.draft ?? 0, icon: 'document-outline' },
                { label: 'Completed', value: counters?.meterInstallation?.completed ?? 0, icon: 'checkmark-done-outline' },
                { label: 'To Sync', value: counters?.meterInstallation?.toSync ?? 0, icon: 'sync-outline' },
              ].map((item) => (
                <View key={`mi-${item.label}`} style={{ width: '50%', padding: 6 }}>
                  <TouchableOpacity activeOpacity={0.8} onPress={() => navigation.navigate('TasksList', { section: 'Meter Installation', label: item.label })} style={{ backgroundColor: COLORS.surface, borderRadius: 12, padding: 12 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <Text style={{ color: COLORS.textSecondary, fontSize: 11 }}>{item.label}</Text>
                      <Ionicons name={item.icon} size={16} color={COLORS.gray} />
                    </View>
                    <Text style={{ fontSize: 20, fontWeight: '700', color: COLORS.textPrimary }}>{item.value}</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </ScrollView>

          {/* Bottom Navigation */}
          <BottomNavigation
            activeTab={activeTab}
            onTabPress={setActiveTab}
            tabs={tabs}
            onMapPress={handleMapTabPress}
            navigation={navigation}
          />
        </Animated.View>
      </SafeAreaView>
      
      {/* Map Modal */}
      <MapModal 
        visible={showMapModal}
        onClose={() => setShowMapModal(false)}
        consumerLocation={mapConsumerLocation}
      />
    </View>
  );
}