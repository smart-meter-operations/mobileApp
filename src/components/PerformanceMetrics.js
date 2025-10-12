import React from 'react';
import { View, Text } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../constants';
import Card from './Card';

const PerformanceMetrics = ({ metrics = [] }) => {
  return (
    <Card style={{ padding: SPACING.lg }}>
      <Text
        style={{
          fontSize: TYPOGRAPHY.fontSizes.lg,
          fontWeight: TYPOGRAPHY.fontWeights.semibold,
          color: COLORS.textPrimary,
          marginBottom: SPACING.lg,
        }}
      >
        Performance Metrics
      </Text>
      
      <View style={{ gap: SPACING.md }}>
        {metrics.map((metric, index) => (
          <View key={index}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.sm }}>
              <Text style={{ color: COLORS.textSecondary, fontSize: TYPOGRAPHY.fontSizes.base }}>
                {metric.label}
              </Text>
              <Text style={{ color: COLORS.textPrimary, fontSize: TYPOGRAPHY.fontSizes.base, fontWeight: TYPOGRAPHY.fontWeights.semibold }}>
                {metric.value}
              </Text>
            </View>
            <View
              style={{
                height: 6,
                backgroundColor: COLORS.background,
                borderRadius: 3,
                overflow: 'hidden',
              }}
            >
              <View
                style={{
                  height: '100%',
                  width: `${metric.percentage}%`,
                  backgroundColor: metric.color || COLORS.primary,
                  borderRadius: 3,
                }}
              />
            </View>
          </View>
        ))}
      </View>
    </Card>
  );
};

export default PerformanceMetrics;