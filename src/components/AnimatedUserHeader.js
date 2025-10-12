import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Dimensions,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../constants';

const { width: screenWidth } = Dimensions.get('window');

const AnimatedUserHeader = ({
  user,
  onUserIconPress,
  syncStatus = 'online',
  pendingItems = 0,
  onSyncNow,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [animationValue] = useState(new Animated.Value(1));
  const [welcomeOpacity] = useState(new Animated.Value(1));
  const [userDetailsOpacity] = useState(new Animated.Value(1));
  // Center title animation
  const [centerIconOpacity] = useState(new Animated.Value(0));
  const [centerTitleOpacity] = useState(new Animated.Value(0));
  const [centerTranslateX] = useState(new Animated.Value(0));

  useEffect(() => {
    // Auto-collapse after 4 seconds to show welcome message longer
    const timer = setTimeout(() => {
      collapseHeader();
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Title intro sequence: "Welcome to" (center) -> icon -> slide -> WATTLY
    // Reset states
    welcomeOpacity.setValue(1);
    centerIconOpacity.setValue(0);
    centerTitleOpacity.setValue(0);
    centerTranslateX.setValue(0);

    Animated.sequence([
      // Hold "Welcome to" briefly
      Animated.delay(900),
      // Fade out "Welcome to"
      Animated.timing(welcomeOpacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      // Fade in icon alone
      Animated.timing(centerIconOpacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.delay(250),
      // Slide slightly to the right to make space for title
      Animated.timing(centerTranslateX, {
        toValue: 24,
        duration: 350,
        useNativeDriver: true,
      }),
      // Fade in title next to icon
      Animated.timing(centerTitleOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const collapseHeader = () => {
    if (!isExpanded) return;

    setIsExpanded(false);

    // Animate the collapse
    Animated.parallel([
      Animated.timing(welcomeOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(userDetailsOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(animationValue, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const expandHeader = () => {
    if (isExpanded) return;

    setIsExpanded(true);

    // Animate the expansion
    Animated.parallel([
      Animated.timing(animationValue, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(welcomeOpacity, {
        toValue: 1,
        duration: 200,
        delay: 100,
        useNativeDriver: true,
      }),
      Animated.timing(userDetailsOpacity, {
        toValue: 1,
        duration: 200,
        delay: 150,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto-collapse again after 5 seconds
    setTimeout(() => {
      collapseHeader();
    }, 5000);
  };

  const handleUserIconPress = () => {
    if (isExpanded) {
      // If expanded, navigate to user profile screen
      onUserIconPress?.();
    } else {
      // If collapsed, navigate to user profile screen directly
      onUserIconPress?.();
    }
  };

  const getSyncStatusIcon = () => {
    if (pendingItems > 0) return 'sync-outline';
    switch (syncStatus) {
      case 'online':
        return 'checkmark-circle';
      case 'syncing':
        return 'sync';
      case 'offline':
        return 'cloud-offline';
      default:
        return 'help-circle';
    }
  };

  const getSyncStatusLabel = () => {
    if (pendingItems > 0) return 'Sync Now';
    switch (syncStatus) {
      case 'online':
        return 'Synced';
      case 'syncing':
        return 'Syncing…';
      case 'offline':
        return 'Offline';
      default:
        return 'Unknown';
    }
  };

  const getSyncColors = () => {
    if (pendingItems > 0) return { bg: COLORS.infoLight, text: COLORS.info };
    switch (syncStatus) {
      case 'online':
        return { bg: COLORS.successLight, text: COLORS.success };
      case 'syncing':
        return { bg: COLORS.warningLight, text: COLORS.warning };
      case 'offline':
        return { bg: COLORS.errorLight, text: COLORS.error };
      default:
        return { bg: COLORS.borderLight, text: COLORS.textSecondary };
    }
  };

  const animatedWidth = animationValue.interpolate({
    inputRange: [0, 1],
    outputRange: [60, Math.min(screenWidth * 0.65, 280)], // Max 65% of screen or 280px
  });

  const animatedPadding = animationValue.interpolate({
    inputRange: [0, 1],
    outputRange: [8, SPACING.md],
  });

  return (
    <View style={styles.container}>
      {/* Center Title (animated) - Fixed positioning to be truly centered */}
      <View style={styles.centerTitleContainer} pointerEvents="none">
       
        <View style={styles.iconTitleContainer}>
          {/* Icon */}
          <Animated.View style={{ opacity: centerIconOpacity }}>
            <Ionicons name="flash-outline" size={18} color={COLORS.textPrimary} style={{ marginRight: 8 }} />
          </Animated.View>
          {/* Title (fades in) */}
          <Animated.Text style={[styles.titleText, { opacity: centerTitleOpacity }]}>WATTLY</Animated.Text>
        </View>
      </View>
      
      {/* Animated User Header - Left Side */}
      <View style={styles.headerContainer}>
        <TouchableOpacity
          style={styles.headerContent}
          onPress={handleUserIconPress}
          activeOpacity={0.8}
        >
          {/* User Avatar - Circular without rectangle wrapper */}
          <View style={styles.circularAvatar}>
            <Text style={styles.avatarText}>{user?.avatar || '👨‍💼'}</Text>
          </View>

          {/* User Details - Only visible when expanded */}
          {false && (
            <Animated.View
              style={[styles.userDetails, { opacity: userDetailsOpacity }]}
            >
              <Animated.Text
                style={[styles.welcomeText, { opacity: welcomeOpacity }]}
              >
                Welcome, {user?.name || 'Rajesh'}
              </Animated.Text>
              <Animated.Text
                style={[styles.roleText, { opacity: userDetailsOpacity }]}
              >
                {user?.role || 'Surveyor / Installer'}
              </Animated.Text>
            </Animated.View>
          )}

          {/* Expand/Collapse indicator */}
          {!isExpanded && (
            <View style={styles.expandIndicator}>
              <Ionicons
                name="chevron-down"
                size={12}
                color={COLORS.textSecondary}
              />
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Sync Now pill should appear ONLY when there are ToSync records */}
      {pendingItems > 0 && (
        <TouchableOpacity
          style={[styles.syncContainer, { backgroundColor: getSyncColors().bg }]}
          activeOpacity={0.8}
          onPress={() => {
            onSyncNow?.();
          }}
        >
          <Ionicons
            name={getSyncStatusIcon()}
            size={16}
            color={getSyncColors().text}
          />
          <Text style={[styles.syncText, { color: getSyncColors().text }]}>
            {getSyncStatusLabel()}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  avatarText: {
    fontSize: TYPOGRAPHY.fontSizes.lg,
  },
  circularAvatar: {
    alignItems: 'center',
    backgroundColor: COLORS.primary, // Dark grey for better visibility
    borderColor: COLORS.white,
    borderRadius: 20,
    borderWidth: 2,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  container: {
    alignItems: 'center',
    backgroundColor: COLORS.headerBackground,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    paddingVertical: SPACING.sm,
    minHeight: 52,
    position: 'relative', // Needed for absolute positioning of center title
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  expandIndicator: {
    marginLeft: SPACING.xs,
  },
  headerContainer: {
    alignSelf: 'flex-start',
    backgroundColor: 'transparent',
    borderRadius: 0, // Align to left side
  },
  headerContent: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  roleText: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSizes.xs,
    marginTop: 2,
  },
  syncContainer: {
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.md,
    flexDirection: 'row',
    height: 30,
    paddingHorizontal: SPACING.sm,
    backgroundColor: COLORS.card, // White background
    elevation: 2, // Subtle elevation
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  syncText: {
    fontSize: TYPOGRAPHY.fontSizes.xs,
    fontWeight: TYPOGRAPHY.fontWeights.medium,
    marginLeft: 6,
  },
  // Fixed center title container
  centerTitleContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    zIndex: 10,
  },
  iconTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 0,
  },
  welcomeCenterText: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSizes.sm,
    fontWeight: TYPOGRAPHY.fontWeights.medium,
    marginRight: 8,
  },
  titleText: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSizes.lg,
    fontWeight: TYPOGRAPHY.fontWeights.bold,
    letterSpacing: 1,
  },
  userDetails: {
    flex: 1,
    marginLeft: SPACING.sm,
  },
  welcomeText: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSizes.sm,
    fontWeight: TYPOGRAPHY.fontWeights.medium,
  },
});

export default AnimatedUserHeader;