import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StatusBar,
  Animated,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Import components and services
import {
  StatsCard,
  List,
  Button,
  BottomNavigation,
  AnimatedUserHeader,
  MapModal,
} from '../components';
import { DataService, NetworkService, DatabaseService } from '../services';
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
  const [syncStatus, setSyncStatus] = useState('online');
  const [showMapModal, setShowMapModal] = useState(false);
  const [mapConsumerLocation, setMapConsumerLocation] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Custom hooks
  const { animatedStyle } = useEntranceAnimation();
  const cardAnims = useStaggeredAnimation(2, 200);
  const { animatedStyle: buttonAnimatedStyle, animatePress } =
    useScaleAnimation();
  const { loading, execute } = useAsyncOperation();

  // Load dashboard data
  useEffect(() => {
    loadDashboardData();
    initializeServices();
  }, []);

  const initializeServices = async () => {
    try {
      // Initialize database service first
      await DatabaseService.initialize();

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
      }
    } catch (error) {
      console.error('Initialize services failed:', error);
    }
  };

  const loadDashboardData = async () => {
    try {
      await execute(async () => {
        const [stats, installations, user] = await Promise.all([
          DataService.getDashboardStats(),
          DataService.getInstallationList(),
          DataService.getUserProfile(),
        ]);

        setDashboardData({ stats, installations, user });
      });
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    }
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

  const handleNewInstallation = () => {
    animatePress();
    console.log('New installation pressed');
    // In future, navigate to create task screen
  };

  const handleUserIconPress = () => {
    navigation.navigate('UserProfileScreen');
  };

  const handleManualSync = async () => {
    if (isSyncing) return;
    
    setIsSyncing(true);
    try {
      const result = await performManualSync();
      
      if (result.success) {
        Alert.alert(
          'Sync Complete',
          `Successfully synced ${result.syncedRecords} records.`,
          [{ text: 'OK' }]
        );
        // Reload dashboard data after sync
        loadDashboardData();
      } else {
        Alert.alert(
          'Sync Failed',
          result.message || result.error || 'Failed to sync data.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert(
        'Sync Error',
        'An error occurred during synchronization.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsSyncing(false);
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
        Alert.alert(
          'Error',
          result.error || 'Failed to insert dummy data.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert(
        'Error',
        error.message || 'An error occurred while inserting dummy data.',
        [{ text: 'OK' }]
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
        Alert.alert(
          'Error',
          result.error || 'Failed to clear data.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert(
        'Error',
        error.message || 'An error occurred while clearing data.',
        [{ text: 'OK' }]
      );
    }
  };

  const tabs = [
    { name: 'Home', title: 'Home', icon: '🏠' },
    { name: 'Task', title: 'Task', icon: '📋' },
    { name: 'Map', title: 'Map', icon: '📍' },
    { name: 'Message', title: 'Message', icon: '💬' },
    { name: 'Capture', title: 'Capture', icon: '📷' },
  ];

  const { stats, installations, user } = dashboardData;

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
            syncStatus={syncStatus}
          />

          <ScrollView
            showsVerticalScrollIndicator={false}
            style={dashboardStyles.scrollContent}
          >
            {/* Debug buttons - only shown in development */}
            {__DEV__ && (
              <View style={{ flexDirection: 'row', justifyContent: 'space-around', padding: 10 }}>
                <TouchableOpacity
                  onPress={handleInsertDummyData}
                  style={{
                    backgroundColor: COLORS.primary,
                    padding: 10,
                    borderRadius: 5,
                    margin: 5
                  }}
                >
                  <Text style={{ color: 'white', fontWeight: 'bold' }}>Insert Dummy Data</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleClearData}
                  style={{
                    backgroundColor: COLORS.error,
                    padding: 10,
                    borderRadius: 5,
                    margin: 5
                  }}
                >
                  <Text style={{ color: 'white', fontWeight: 'bold' }}>Clear Data</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Stats Cards */}
            <View style={dashboardStyles.statsContainer}>
              <StatsCard
                title="SURVEY"
                icon="📋"
                number={stats?.survey?.total || 0}
                label="Task"
                details={[
                  {
                    label: 'Completed',
                    count: stats?.survey?.completed || 0,
                    color: COLORS.success,
                  },
                  {
                    label: 'Pending',
                    count: stats?.survey?.pending || 0,
                    color: COLORS.error,
                  },
                ]}
                onPress={() => handleCardPress('survey')}
                animatedStyle={{
                  opacity: cardAnims[0],
                  transform: [{ scale: cardAnims[0] }],
                }}
                style={{ flex: 1 }}
              />

              <StatsCard
                title="INSTALLATION"
                icon="⚙️"
                number={stats?.installation?.total || 0}
                label="Task"
                variant="primary"
                details={[
                  {
                    label: 'Completed',
                    count: stats?.installation?.completed || 0,
                    color: COLORS.success,
                  },
                  {
                    label: 'Pending',
                    count: stats?.installation?.pending || 0,
                    color: COLORS.error,
                  },
                ]}
                onPress={() => handleCardPress('installation')}
                animatedStyle={{
                  opacity: cardAnims[1],
                  transform: [{ scale: cardAnims[1] }],
                }}
                style={{ flex: 1 }}
              />
            </View>

            {/* Manual Sync Button */}
            <View style={dashboardStyles.syncButtonContainer}>
              <Button
                title={isSyncing ? "Syncing..." : "Sync Now"}
                onPress={handleManualSync}
                disabled={isSyncing}
                style={dashboardStyles.syncButton}
              />
            </View>

            {/* Table Header */}
            <View style={dashboardStyles.tableHeader}>
              <Text style={[dashboardStyles.tableHeaderText, { flex: 1 }]}>
                NAME
              </Text>
              <Text
                style={[
                  dashboardStyles.tableHeaderText,
                  { width: 80, textAlign: 'center' },
                ]}
              >
                STATUS
              </Text>
            </View>

            {/* Installation List */}
            <List
              data={installations}
              onItemPress={handleListItemPress}
              showStatus={true}
              emptyMessage="No installations available"
            />

            {/* New Installation Button */}
            <Animated.View style={buttonAnimatedStyle}>
              <Button
                title="+ New Installation"
                onPress={handleNewInstallation}
                style={dashboardStyles.newInstallationButton}
              />
            </Animated.View>
          </ScrollView>

          {/* Bottom Navigation */}
          <BottomNavigation
            activeTab={activeTab}
            onTabPress={setActiveTab}
            tabs={tabs}
            onMapPress={handleMapTabPress}
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