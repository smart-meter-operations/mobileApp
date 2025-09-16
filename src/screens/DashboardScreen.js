import React, { useEffect, useState } from 'react';
import { View, Text, SafeAreaView, ScrollView, StatusBar, Animated } from 'react-native';

// Import components and services
import { StatsCard, List, Button, BottomNavigation, AnimatedUserHeader } from '../components';
import { DataService, NetworkService, DatabaseService } from '../services';
import { useEntranceAnimation, useStaggeredAnimation, useScaleAnimation, useAsyncOperation } from '../hooks';
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
  
  // Custom hooks
  const { animatedStyle } = useEntranceAnimation();
  const cardAnims = useStaggeredAnimation(2, 200);
  const { animatedStyle: buttonAnimatedStyle, animatePress } = useScaleAnimation();
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
          setSyncStatus(networkState.isConnected && networkState.isInternetReachable ? 'online' : 'offline');
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
    // In future, navigate to task details
  };

  const handleNewInstallation = () => {
    animatePress();
    console.log('New installation pressed');
    // In future, navigate to create task screen
  };

  const handleUserIconPress = () => {
    navigation.navigate('UserProfileScreen');
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

        <ScrollView showsVerticalScrollIndicator={false} style={dashboardStyles.scrollContent}>
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
                  color: COLORS.success 
                },
                { 
                  label: 'Pending', 
                  count: stats?.survey?.pending || 0, 
                  color: COLORS.error 
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
                  color: COLORS.success 
                },
                { 
                  label: 'Pending', 
                  count: stats?.installation?.pending || 0, 
                  color: COLORS.error 
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

          {/* Table Header */}
          <View style={dashboardStyles.tableHeader}>
            <Text style={[dashboardStyles.tableHeaderText, { flex: 1 }]}>NAME</Text>
            <Text style={[dashboardStyles.tableHeaderText, { width: 80, textAlign: 'center' }]}>
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
          navigation={navigation}
        />
      </Animated.View>
      </SafeAreaView>
    </View>
  );
}