import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Dimensions,
  StyleSheet
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../constants';

const { width: screenWidth } = Dimensions.get('window');

const AnimatedUserHeader = ({ user, onUserIconPress, syncStatus = 'online' }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [animationValue] = useState(new Animated.Value(1));
  const [welcomeOpacity] = useState(new Animated.Value(1));
  const [userDetailsOpacity] = useState(new Animated.Value(1));

  useEffect(() => {
    // Auto-collapse after 4 seconds to show welcome message longer
    const timer = setTimeout(() => {
      collapseHeader();
    }, 4000);

    return () => clearTimeout(timer);
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
      {/* Animated User Header - Left Side */}
      <Animated.View 
        style={[
          styles.headerContainer,
          {
            width: animatedWidth,
            paddingHorizontal: animatedPadding,
            paddingVertical: animatedPadding,
          }
        ]}
      >
        <TouchableOpacity 
          style={styles.headerContent}
          onPress={handleUserIconPress}
          activeOpacity={0.8}
        >
          {/* User Avatar - Circular without rectangle wrapper */}
          <View style={styles.circularAvatar}>
            <Text style={styles.avatarText}>
              {user?.avatar || '👨‍💼'}
            </Text>
          </View>

          {/* User Details - Only visible when expanded */}
          {isExpanded && (
            <Animated.View 
              style={[
                styles.userDetails,
                { opacity: userDetailsOpacity }
              ]}
            >
              <Animated.Text 
                style={[
                  styles.welcomeText,
                  { opacity: welcomeOpacity }
                ]}
              >
                Welcome, {user?.name || 'Rajesh'}
              </Animated.Text>
              <Animated.Text 
                style={[
                  styles.roleText,
                  { opacity: userDetailsOpacity }
                ]}
              >
                {user?.role || 'Surveyor / Installer'}
              </Animated.Text>
            </Animated.View>
          )}

          {/* Expand/Collapse indicator */}
          {!isExpanded && (
            <View style={styles.expandIndicator}>
              <Ionicons name="chevron-down" size={12} color={COLORS.textSecondary} />
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>

      {/* Sync Status Pill - Right Side */}
      <TouchableOpacity 
        style={[
          styles.syncContainer,
          { backgroundColor: getSyncColors().bg }
        ]}
        activeOpacity={0.8}
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    paddingTop: SPACING.lg,
    backgroundColor: COLORS.headerBackground,
  },
  syncContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    height: 32,
    borderRadius: BORDER_RADIUS.lg,
  },
  headerContainer: {
    backgroundColor: 'transparent',
    borderRadius: 0,
    alignSelf: 'flex-start', // Align to left side
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circularAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  avatarText: {
    fontSize: TYPOGRAPHY.fontSizes.lg,
  },
  userDetails: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  welcomeText: {
    fontSize: TYPOGRAPHY.fontSizes.lg,
    fontWeight: TYPOGRAPHY.fontWeights.semibold,
    color: COLORS.textWhite,
  },
  roleText: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.textLight,
    marginTop: 2,
  },
  expandIndicator: {
    marginLeft: SPACING.xs,
  },
  syncText: {
    marginLeft: 6,
    fontSize: TYPOGRAPHY.fontSizes.sm,
    fontWeight: TYPOGRAPHY.fontWeights.medium,
  },
});

export default AnimatedUserHeader;