import React, { forwardRef } from 'react';
import { TextInput } from 'react-native';
import { inputStyles } from '../styles';

const Input = forwardRef(({ 
  style = {},
  focused = false,
  error = false,
  ...props 
}, ref) => {
  const focusedStyle = focused ? inputStyles.textInputFocused : {};
  
  return (
    <TextInput
      ref={ref}
      style={[inputStyles.textInput, focusedStyle, style]}
      placeholderTextColor="#999"
      {...props}
    />
  );
});

Input.displayName = 'Input';

export default Input;