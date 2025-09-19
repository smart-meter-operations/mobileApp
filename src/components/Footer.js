import React from 'react';
import { View, Text } from 'react-native';
import { footerStyles } from '../styles';
import { APP_CONFIG } from '../constants';

const Footer = ({ visible = true, style = {} }) => {
  if (!visible) return null;

  return (
    <View style={[footerStyles.footer, style]}>
      <Text style={footerStyles.footerText}>
        ⚡ Powered by {APP_CONFIG.companyName}
      </Text>
    </View>
  );
};

export default Footer;
