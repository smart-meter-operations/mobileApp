import React, { forwardRef } from 'react';
import { TextInput, Platform } from 'react-native';
import { inputStyles } from '../styles';
import { COLORS } from '../constants';

const Input = forwardRef(
  ({ style = {}, focused = false, error = false, ...props }, ref) => {
    const focusedStyle = focused ? inputStyles.textInputFocused : {};
    const errorStyle = error ? { borderColor: COLORS.error } : {};

    return (
      <TextInput
        ref={ref}
        style={[inputStyles.textInput, focusedStyle, errorStyle, style]}
        placeholderTextColor={COLORS.textSecondary} // Use theme color for placeholder
        selectionColor={COLORS.primary} // Use theme color for cursor
        autoCapitalize="none"
        autoCorrect={false}
        spellCheck={false}
        autoComplete="off"
        enablesReturnKeyAutomatically={true}
        blurOnSubmit={Platform.OS === 'ios' ? false : true}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';

export default Input;