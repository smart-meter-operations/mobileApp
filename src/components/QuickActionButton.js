import React from 'react';
import { TouchableOpacity, Text, View } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../constants';

const QuickActionButton = ({ title, icon, onPress, disabled = false, style = {} }) => {
  return (
    <TouchableOpacity
      style={[
        {
          backgroundColor: COLORS.surface,
          borderRadius: BORDER_RADIUS.lg,
          padding: SPACING.lg,
          alignItems: 'center',
          justifyContent: 'center',
          elevation: 2,
          shadowColor: COLORS.shadow,
          shadowOffset: {
            width: 0,
            height: 1,
          },
          shadowOpacity: 0.08,
          shadowRadius: 4,
          width: 80,
          height: 80,
        },
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: COLORS.background,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: SPACING.sm,
        }}
      >
        <Text style={{ fontSize: 20 }}>{icon}</Text>
      </View>
      <Text
        style={{
          color: COLORS.textPrimary,
          fontSize: TYPOGRAPHY.fontSizes.sm,
          fontWeight: TYPOGRAPHY.fontWeights.medium,
          textAlign: 'center',
        }}
        numberOfLines={2}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
};

export default QuickActionButton;