import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Controller } from 'react-hook-form';
import { Input } from '../Input';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../../constants';

const FormInput = ({
  control,
  name,
  label,
  placeholder,
  multiline = false,
  numberOfLines = 1,
  keyboardType = 'default',
  editable = true,
  required = false,
  rules = {},
  style = {},
}) => (
  <View style={[styles.inputContainer, style]}>
    {label && (
      <Text style={styles.inputLabel}>
        {label} {required && <Text style={styles.requiredIndicator}>*</Text>}
      </Text>
    )}
    <Controller
      control={control}
      name={name}
      rules={required ? { required: 'This field is required' } : rules}
      render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
        <>
          <Input
            placeholder={placeholder || label}
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            multiline={multiline}
            numberOfLines={multiline ? numberOfLines : 1}
            keyboardType={keyboardType}
            editable={editable}
            style={[styles.inputField, multiline && styles.multilineInput, error && { borderColor: COLORS.error }]}
            error={!!error}
          />
          {error ? (
            <Text style={styles.errorText}>{error.message}</Text>
          ) : null}
        </>
      )}
    />
  </View>
);

const styles = StyleSheet.create({
  inputContainer: {
    marginBottom: SPACING.sm,
  },
  inputLabel: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSizes.sm,
    fontWeight: TYPOGRAPHY.fontWeights.medium,
    marginBottom: SPACING.xs,
  },
  requiredIndicator: {
    color: COLORS.error,
  },
  inputField: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSizes.base,
    minHeight: 44,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  multilineInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  errorText: {
    color: COLORS.error,
    fontSize: TYPOGRAPHY.fontSizes.sm,
    marginTop: SPACING.xs,
  },
});

export default FormInput;