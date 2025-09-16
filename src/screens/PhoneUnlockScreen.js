import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  Linking,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Import services and components
import { Button } from '../components';
import { PhoneUnlockService } from '../services';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../constants';

const PhoneUnlockScreen = ({ navigation, route }) => {
  const [loading, setLoading] = useState(false);
  const [authInfo, setAuthInfo] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    initializeAuthentication();
  }, []);

  const initializeAuthentication = async () => {
    try {
      setLoading(true);
      
      // Initialize phone unlock service
      await PhoneUnlockService.initialize();
      
      // Get authentication info
      const info = await PhoneUnlockService.getAuthenticationInfo();
      setAuthInfo(info);
      
      // Check if already recently authenticated
      if (info.recentlyAuthenticated) {
        handleAuthenticationSuccess();
        return;
      }

      // Start authentication process
      setTimeout(() => {
        authenticateUser();
      }, 1000);
      
    } catch (error) {
      console.error('Initialize authentication failed:', error);
      setError('Failed to initialize authentication');
    } finally {
      setLoading(false);
    }
  };

  const authenticateUser = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await PhoneUnlockService.authenticate();
      
      if (result.success) {
        handleAuthenticationSuccess();
      } else {
        setError(result.error || 'Authentication failed');
      }
    } catch (error) {
      console.error('User authentication failed:', error);
      setError('Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAuthenticationSuccess = () => {
    // Navigate to success screen
    navigation.navigate('Success');
  };

  const handleSkip = () => {
    Alert.alert(
      'Skip Authentication',
      'Phone unlock authentication provides additional security. Are you sure you want to skip?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Skip',
          onPress: () => navigation.navigate('Success')
        }
      ]
    );
  };

  const handleEnrollBiometrics = () => {
    Alert.alert(
      'Set Up Biometrics',
      'To use biometric authentication, please set up fingerprint, face unlock, or other biometric methods in your device settings.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Open Settings',
          onPress: () => {
            // For Android, open security settings
            if (Platform.OS === 'android') {
              Linking.openURL('android.settings.SECURITY_SETTINGS').catch(() => {
                Alert.alert('Info', 'Please manually go to Settings > Security > Biometrics to set up authentication.');
              });
            } else {
              // For iOS, open Face ID & Passcode or Touch ID & Passcode settings
              Linking.openURL('app-settings:').catch(() => {
                Alert.alert('Info', 'Please manually go to Settings > Face ID & Passcode to set up authentication.');
              });
            }
          }
        },
        {
          text: 'Use PIN/Pattern',
          onPress: () => authenticateUser()
        }
      ]
    );
  };

  const getAuthMethodText = () => {
    if (!authInfo) return 'Authentication';
    
    if (authInfo.biometricSupport.isSupported) {
      const types = authInfo.availableTypes;
      if (types.includes('fingerprint')) return 'Fingerprint';
      if (types.includes('faceId')) return 'Face ID';
      if (types.includes('iris')) return 'Iris';
      return 'Biometric';
    } else {
      return 'PIN or Pattern';
    }
  };

  const getAuthIcon = () => {
    if (!authInfo) return 'lock-closed';
    
    if (authInfo.biometricSupport.isSupported) {
      const types = authInfo.availableTypes;
      if (types.includes('fingerprint')) return 'finger-print';
      if (types.includes('faceId')) return 'scan';
      return 'scan-circle';
    } else {
      return 'keypad';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Phone Unlock</Text>
          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleSkip}
          >
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        </View>

        {/* Main Content */}
        <View style={styles.mainContent}>
          {/* Icon */}
          <View style={styles.iconContainer}>
            <Ionicons 
              name={getAuthIcon()} 
              size={80} 
              color={loading ? COLORS.primary : COLORS.textSecondary} 
            />
          </View>

          {/* Title */}
          <Text style={styles.title}>
            Unlock with {getAuthMethodText()}
          </Text>

          {/* Description */}
          <Text style={styles.description}>
            {authInfo?.biometricSupport.isSupported
              ? `Use your ${getAuthMethodText().toLowerCase()} to verify it's really you.`
              : 'Use your device PIN or pattern to verify it\'s really you.'
            }
          </Text>

          {/* Loading or Error State */}
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.loadingText}>Authenticating...</Text>
            </View>
          )}

          {error && (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={24} color={COLORS.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Retry Button */}
          {error && !loading && (
            <Button
              title="Try Again"
              onPress={authenticateUser}
              style={styles.retryButton}
            />
          )}

          {/* Enrollment Options */}
          {authInfo && authInfo.biometricSupport.hasHardware && !authInfo.biometricSupport.isEnrolled && (
            <View style={styles.enrollmentContainer}>
              <Ionicons name="information-circle" size={24} color={COLORS.warning} />
              <Text style={styles.enrollmentTitle}>Biometric Not Set Up</Text>
              <Text style={styles.enrollmentText}>
                Your device supports biometric authentication, but it's not set up yet.
              </Text>
              <Button
                title="Set Up Biometrics"
                onPress={handleEnrollBiometrics}
                style={styles.enrollmentButton}
              />
            </View>
          )}

          {/* No Biometric Hardware */}
          {authInfo && !authInfo.biometricSupport.hasHardware && (
            <View style={styles.infoContainer}>
              <Ionicons name="information-circle" size={20} color={COLORS.info} />
              <Text style={styles.infoText}>
                Your device doesn't support biometric authentication. Using device PIN/Pattern instead.
              </Text>
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            This adds an extra layer of security to your account
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  backButton: {
    padding: SPACING.sm,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.fontSizes.xl,
    fontWeight: TYPOGRAPHY.fontWeights.semibold,
    color: COLORS.text,
  },
  skipButton: {
    padding: SPACING.sm,
  },
  skipText: {
    fontSize: TYPOGRAPHY.fontSizes.md,
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.fontWeights.medium,
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xl,
    elevation: 4,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSizes['2xl'],
    fontWeight: TYPOGRAPHY.fontWeights.bold,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  description: {
    fontSize: TYPOGRAPHY.fontSizes.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: SPACING.xl,
  },
  loadingContainer: {
    alignItems: 'center',
    marginVertical: SPACING.xl,
  },
  loadingText: {
    fontSize: TYPOGRAPHY.fontSizes.md,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.errorLight,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginVertical: SPACING.lg,
  },
  errorText: {
    fontSize: TYPOGRAPHY.fontSizes.md,
    color: COLORS.error,
    marginLeft: SPACING.sm,
    flex: 1,
  },
  retryButton: {
    marginTop: SPACING.lg,
    minWidth: 120,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.warningLight,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginTop: SPACING.xl,
  },
  infoText: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.info,
    marginLeft: SPACING.sm,
    flex: 1,
    textAlign: 'center',
  },
  enrollmentContainer: {
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    marginTop: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.warning,
  },
  enrollmentTitle: {
    fontSize: TYPOGRAPHY.fontSizes.lg,
    fontWeight: TYPOGRAPHY.fontWeights.semibold,
    color: COLORS.text,
    marginTop: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  enrollmentText: {
    fontSize: TYPOGRAPHY.fontSizes.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: SPACING.lg,
  },
  enrollmentButton: {
    backgroundColor: COLORS.warning,
    minWidth: 160,
  },
  footer: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xl,
    alignItems: 'center',
  },
  footerText: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});

export default PhoneUnlockScreen;