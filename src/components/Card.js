import React from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { cardStyles } from '../styles';
import { COLORS } from '../constants';

const Card = ({
  children,
  style = {},
  variant = 'default', // 'default' | 'primary'
  onPress,
  disabled = false,
  animatedStyle = {},
  ...props
}) => {
  const cardVariantStyle = variant === 'primary' ? cardStyles.cardPrimary : {};

  const CardComponent = onPress ? TouchableOpacity : View;

  return (
    <Animated.View style={animatedStyle}>
      <CardComponent
        style={[cardStyles.card, cardVariantStyle, style]}
        onPress={onPress}
        disabled={disabled}
        activeOpacity={onPress ? 0.8 : 1}
        {...props}
      >
        {children}
      </CardComponent>
    </Animated.View>
  );
};

// Card Header component
export const CardHeader = ({
  title,
  icon,
  variant = 'default',
  style = {},
}) => {
  const titleStyle =
    variant === 'primary' ? cardStyles.cardTitleWhite : cardStyles.cardTitle;

  return (
    <View style={[cardStyles.cardHeader, style]}>
      <Text style={titleStyle}>{title}</Text>
      {icon && <Text style={cardStyles.cardIcon}>{icon}</Text>}
    </View>
  );
};

// Stats Card component (specific for dashboard)
export const StatsCard = ({
  title,
  icon,
  number,
  label,
  details = [],
  variant = 'default',
  onPress,
  animatedStyle = {},
  style = {},
}) => {
  const isWhiteVariant = variant === 'primary';
  const numberStyle = isWhiteVariant ? { color: COLORS.textWhite } : {};
  const labelStyle = isWhiteVariant ? { color: 'rgba(255,255,255,0.8)' } : {};

  return (
    <Card
      variant={variant}
      onPress={onPress}
      animatedStyle={animatedStyle}
      style={style}
    >
      <CardHeader title={title} icon={icon} variant={variant} />

      <Text
        style={[
          {
            fontSize: 32,
            fontWeight: '700',
            color: COLORS.textPrimary,
            marginBottom: 4,
          },
          numberStyle,
        ]}
      >
        {number}
      </Text>

      <Text
        style={[
          {
            fontSize: 14,
            color: COLORS.textSecondary,
            marginBottom: 16,
          },
          labelStyle,
        ]}
      >
        {label}
      </Text>

      <View style={{ gap: 8 }}>
        {details.map((detail, index) => (
          <View
            key={index}
            style={{ flexDirection: 'row', alignItems: 'center' }}
          >
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: detail.color,
                marginRight: 8,
              }}
            />
            <Text
              style={[
                {
                  flex: 1,
                  fontSize: 12,
                  color: COLORS.textSecondary,
                },
                isWhiteVariant && { color: 'rgba(255,255,255,0.9)' },
              ]}
            >
              {detail.label}
            </Text>
            <Text
              style={[
                {
                  fontSize: 14,
                  fontWeight: '600',
                  color: COLORS.textPrimary,
                },
                isWhiteVariant && { color: COLORS.textWhite },
              ]}
            >
              {detail.count}
            </Text>
          </View>
        ))}
      </View>
    </Card>
  );
};

export default Card;
