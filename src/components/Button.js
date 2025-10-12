import React, { forwardRef } from 'react';
import { TouchableOpacity, Text, Animated } from 'react-native';
import { buttonStyles } from '../styles';

const Button = forwardRef(
  (
    {
      title,
      onPress,
      disabled = false,
      loading = false,
      variant = 'primary', // 'primary' | 'secondary'
      style = {},
      textStyle = {},
      children,
      ...props
    },
    ref
  ) => {
    const buttonStyle =
      variant === 'primary'
        ? buttonStyles.primaryButton
        : buttonStyles.secondaryButton;
    const buttonTextStyle =
      variant === 'primary'
        ? buttonStyles.primaryButtonText
        : buttonStyles.secondaryButtonText;

    const disabledStyle =
      disabled || loading ? buttonStyles.primaryButtonDisabled : {};

    return (
      <TouchableOpacity
        ref={ref}
        style={[buttonStyle, disabledStyle, style]}
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={0.7} // Material UI active opacity
        {...props}
      >
        <Text style={[buttonTextStyle, textStyle]}>
          {loading ? 'Loading...' : children || title}
        </Text>
      </TouchableOpacity>
    );
  }
);

// Animated Button component
export const AnimatedButton = ({ animatedStyle, ...props }) => {
  return (
    <Animated.View style={animatedStyle}>
      <Button {...props} />
    </Animated.View>
  );
};

Button.displayName = 'Button';

export default Button;