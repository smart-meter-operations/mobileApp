import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { dashboardStyles } from '../styles';
import { SCREENS, COLORS } from '../constants';

const BottomTabButton = ({ title, icon, isActive, onPress }) => (
  <TouchableOpacity
    style={[
      dashboardStyles.tabButton,
      isActive && dashboardStyles.activeTabButton,
    ]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <Ionicons
      name={icon}
      size={20}
      color={isActive ? COLORS.textPrimary : COLORS.textSecondary}
    />
    <Text
      style={[
        dashboardStyles.tabText,
        isActive && dashboardStyles.activeTabText,
      ]}
    >
      {title}
    </Text>
  </TouchableOpacity>
);

const BottomNavigation = ({ activeTab, onTabPress, tabs = [], onMapPress, navigation }) => {
  const handleTabPress = (tabName) => {
    if (tabName === 'Capture') {
      // Handle Capture tab press
      console.log('Capture tab pressed');
      navigation.navigate('MeterCapture');
    } else if (tabName === 'Masterdata') {
      // Handle Masterdata tab press
      console.log('Masterdata tab pressed');
      navigation.navigate('MasterData');
    } else {
      // Handle other tabs
      onTabPress(tabName);
    }
  };

  return (
    <View style={dashboardStyles.bottomNav}>
      {tabs.map((tab) => (
        <BottomTabButton
          key={tab.name}
          title={tab.title}
          icon={tab.icon}
          isActive={activeTab === tab.name}
          onPress={() => handleTabPress(tab.name)}
        />
      ))}
    </View>
  );
};

export default BottomNavigation;