import React from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet } from 'react--native';
import { Controller } from 'react-hook-form';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../../constants';

const FormDropdown = ({
  control,
  name,
  label,
  options = [],
  required = false,
  rules = {},
  style = {},
}) => (
  <View style={[styles.inputContainer, style]}>
    <Text style={styles.inputLabel}>
      {label} {required && <Text style={styles.requiredIndicator}>*</Text>}
    </Text>
    <Controller
      control={control}
      name={name}
      rules={required ? { required: 'This field is required' } : rules}
      render={({ field: { onChange, value }, fieldState: { error } }) => (
        <TouchableOpacity
          style={[styles.dropdownContainer, error && { borderColor: COLORS.error }]}
          onPress={() => {
            Alert.alert(label, 'Select an option', [
              ...options.map((option) => ({
                text: option,
                onPress: () => onChange(option),
              })),
              { text: 'Cancel', style: 'cancel' },
            ]);
          }}
        >
          <Text style={styles.dropdownText}>
            {value || `Select ${label}`}
          </Text>
          <Ionicons
            name="chevron-down"
            size={20}
            color={COLORS.textSecondary}
          />
        </TouchableOpacity>
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
  dropdownContainer: {
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 40,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  dropdownText: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSizes.base,
  },
});

export default FormDropdown;