import React from 'react';
import { View, Text } from 'react-native';
import { headerStyles } from '../styles';
import { APP_CONFIG } from '../constants';

const AppHeader = ({ style = {} }) => {
  return (
    <View style={[headerStyles.header, style]}>
      <View style={headerStyles.logoContainer}>
        <View style={headerStyles.logoIcon}>
          <Text style={headerStyles.logoIconText}>⚙</Text>
        </View>
        <Text style={headerStyles.logoText}>{APP_CONFIG.name}</Text>
      </View>
    </View>
  );
};

export default AppHeader;
