import React from 'react';
import { View, Text, FlatList } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../constants';
import Card from './Card';

const RecentActivities = ({ activities = [] }) => {
  const renderActivityItem = ({ item }) => (
    <View
      style={{
        flexDirection: 'row',
        paddingVertical: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.borderLight,
      }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: item.color || COLORS.background,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: SPACING.md,
        }}
      >
        <Text style={{ fontSize: 16 }}>{item.icon}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            color: COLORS.textPrimary,
            fontSize: TYPOGRAPHY.fontSizes.base,
            fontWeight: TYPOGRAPHY.fontWeights.medium,
            marginBottom: 2,
          }}
        >
          {item.title}
        </Text>
        <Text
          style={{
            color: COLORS.textSecondary,
            fontSize: TYPOGRAPHY.fontSizes.sm,
            marginBottom: 2,
          }}
        >
          {item.description}
        </Text>
        <Text
          style={{
            color: COLORS.textMuted,
            fontSize: TYPOGRAPHY.fontSizes.sm,
          }}
        >
          {item.time}
        </Text>
      </View>
    </View>
  );

  return (
    <Card style={{ padding: 0 }}>
      <View
        style={{
          padding: SPACING.lg,
          borderBottomWidth: 1,
          borderBottomColor: COLORS.border,
        }}
      >
        <Text
          style={{
            fontSize: TYPOGRAPHY.fontSizes.lg,
            fontWeight: TYPOGRAPHY.fontWeights.semibold,
            color: COLORS.textPrimary,
          }}
        >
          Recent Activities
        </Text>
      </View>
      <FlatList
        data={activities}
        renderItem={renderActivityItem}
        keyExtractor={(item, index) => index.toString()}
        scrollEnabled={false}
        style={{ paddingHorizontal: SPACING.lg }}
      />
    </Card>
  );
};

export default RecentActivities;