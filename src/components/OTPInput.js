import React, { forwardRef } from 'react';
import { TextInput, Animated } from 'react-native';
import { otpStyles } from '../styles';

const OTPInput = forwardRef(({ 
  value, 
  onChangeText, 
  onKeyPress,
  style = {},
  animatedStyle = {},
  ...props 
}, ref) => {
  const filled = value && value.length > 0;
  
  return (
    <Animated.View style={animatedStyle}>
      <TextInput
        ref={ref}
        style={[otpStyles.otpInput, filled && otpStyles.otpInputFilled, style]}
        value={value}
        onChangeText={onChangeText}
        onKeyPress={onKeyPress}
        keyboardType="numeric"
        maxLength={1}
        textAlign="center"
        {...props}
      />
    </Animated.View>
  );
});

OTPInput.displayName = 'OTPInput';

export default OTPInput;