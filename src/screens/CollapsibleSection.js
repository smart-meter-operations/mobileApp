import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../../constants';

const CollapsibleSection = ({
  title,
  children,
  sectionKey,
  isExpanded,
  toggleSection,
}) => {
  return (
    <View style={styles.sectionContainer}>
      <TouchableOpacity
        style={styles.collapsibleHeader}
        onPress={() => toggleSection(sectionKey)}
        activeOpacity={0.7}
      >
        <Text style={styles.collapsibleTitle}>{title}</Text>
        <Ionicons
          name={isExpanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={COLORS.textPrimary}
        />
      </TouchableOpacity>

      {isExpanded && <View style={styles.collapsibleContent}>{children}</View>}
    </View>
  );
};

const styles = StyleSheet.create({
  sectionContainer: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    elevation: 2,
    marginBottom: SPACING.sm,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  collapsibleHeader: {
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: SPACING.md,
  },
  collapsibleTitle: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSizes.lg,
    fontWeight: TYPOGRAPHY.fontWeights.semibold,
  },
  collapsibleContent: {
    padding: SPACING.md,
  },
});

export default CollapsibleSection;