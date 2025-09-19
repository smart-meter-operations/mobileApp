import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { dashboardStyles } from '../styles';
import { SCREENS } from '../constants';

const BottomTabButton = ({ title, icon, isActive, onPress }) => (
  <TouchableOpacity
    style={[
      dashboardStyles.tabButton,
      isActive && dashboardStyles.activeTabButton,
    ]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <Text
      style={[
        dashboardStyles.tabIcon,
        isActive && dashboardStyles.activeTabIcon,
      ]}
    >
      {icon}
    </Text>
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

const BottomNavigation = ({ activeTab, onTabPress, tabs = [], navigation }) => {
  const handleTabPress = (tabName) => {
    if (tabName === 'Capture') {
      // Navigate to Capture screen
      navigation?.navigate('Capture');
    } else if (tabName === 'Map') {
      // Navigate to Map screen
      navigation?.navigate(SCREENS.MAP);
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
