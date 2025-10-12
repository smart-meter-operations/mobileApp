import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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

      // For web platform, we don't need to auto-start authentication
      // as it's not available anyway
      if (Platform.OS !== 'web') {
        // Start authentication process
        setTimeout(() => {
          authenticateUser();
        }, 1000);
      }
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
      console.log('Authenticating user, Platform:', Platform.OS);

      const result = await PhoneUnlockService.authenticate();
      console.log('Authentication result:', result);

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
    console.log('Skip button pressed, Platform:', Platform.OS);

    Alert.alert(
      'Skip Authentication',
      'Phone unlock authentication provides additional security. Are you sure you want to skip?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Skip',
          onPress: () => {
            if (Platform.OS === 'web') {
              if (document && document.activeElement) {
                document.activeElement.blur();
              }
            }
            navigation.navigate('Success');
          },
        },
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
              Linking.openURL('android.settings.SECURITY_SETTINGS').catch(
                () => {
                  Alert.alert(
                    'Info',
                    'Please manually go to Settings > Security > Biometrics to set up authentication.'
                  );
                }
              );
            } else {
              // For iOS, open Face ID & Passcode or Touch ID & Passcode settings
              Linking.openURL('app-settings:').catch(() => {
                Alert.alert(
                  'Info',
                  'Please manually go to Settings > Face ID & Passcode to set up authentication.'
                );
              });
            }
          },
        },
        {
          text: 'Use PIN/Pattern',
          onPress: () => authenticateUser(),
        },
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

  // For web platform, show a demo message
  const renderWebDemoMessage = () => {
    if (Platform.OS !== 'web') return null;

    return (
      <View style={styles.webDemoContainer}>
        <Ionicons name="information-circle" size={24} color={COLORS.info} />
        <Text style={styles.webDemoTitle}>Web Demo Mode</Text>
        <Text style={styles.webDemoText}>
          Biometric authentication is not available in web browsers. 
          Click "Skip" to proceed to the next screen.
        </Text>
      </View>
    );
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
          <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        </View>

        {/* Main Content */}
        <View style={styles.mainContent}>
          {/* Web Demo Message */}
          {renderWebDemoMessage()}

          {/* Icon */}
          <View style={styles.iconContainer}>
            <Ionicons
              name={getAuthIcon()}
              size={80}
              color={loading ? COLORS.primary : COLORS.textSecondary}
            />
          </View>

          {/* Title */}
          <Text style={styles.title}>Unlock with {getAuthMethodText()}</Text>

          {/* Description */}
          <Text style={styles.description}>
            {authInfo?.biometricSupport.isSupported
              ? `Use your ${getAuthMethodText().toLowerCase()} to verify it's really you.`
              : "Use your device PIN or pattern to verify it's really you."}
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
          {authInfo &&
            authInfo.biometricSupport.hasHardware &&
            !authInfo.biometricSupport.isEnrolled && (
              <View style={styles.enrollmentContainer}>
                <Ionicons
                  name="information-circle"
                  size={24}
                  color={COLORS.warning}
                />
                <Text style={styles.enrollmentTitle}>Biometric Not Set Up</Text>
                <Text style={styles.enrollmentText}>
                  Your device supports biometric authentication, but it&apos;s
                  not set up yet.
                </Text>
                <Button
                  title="Set Up Biometrics"
                  onPress={handleEnrollBiometrics}
                  style={styles.enrollmentButton}
                />
              </View>
            )}

          {/* No Biometric Hardware */}
          {authInfo && !authInfo.biometricSupport.hasHardware && Platform.OS !== 'web' && (
            <View style={styles.infoContainer}>
              <Ionicons
                name="information-circle"
                size={20}
                color={COLORS.info}
              />
              <Text style={styles.infoText}>
                Your device doesn&apos;t support biometric authentication. Using
                device PIN/Pattern instead.
              </Text>
            </View>
          )}

          {/* Web Platform Authentication Button */}
          {Platform.OS === 'web' && (
            <Button
              title="Authenticate (Demo)"
              onPress={authenticateUser}
              style={styles.demoButton}
              disabled={loading}
            />
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
  backButton: {
    padding: SPACING.sm,
  },
  container: {
    backgroundColor: COLORS.background,
    flex: 1,
  },
  content: {
    flex: 1,
  },
  demoButton: {
    marginTop: SPACING.lg,
    minWidth: 160,
  },
  description: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSizes.md,
    lineHeight: 24,
    marginBottom: SPACING.xl,
    textAlign: 'center',
  },
  enrollmentButton: {
    backgroundColor: COLORS.warning,
    minWidth: 160,
  },
  enrollmentContainer: {
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderColor: COLORS.warning,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    marginTop: SPACING.xl,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
  },
  enrollmentText: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSizes.md,
    lineHeight: 20,
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
  enrollmentTitle: {
    color: COLORS.text,
    fontSize: TYPOGRAPHY.fontSizes.lg,
    fontWeight: TYPOGRAPHY.fontWeights.semibold,
    marginBottom: SPACING.sm,
    marginTop: SPACING.sm,
  },
  errorContainer: {
    alignItems: 'center',
    backgroundColor: COLORS.errorLight,
    borderRadius: BORDER_RADIUS.md,
    flexDirection: 'row',
    marginVertical: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  errorText: {
    color: COLORS.error,
    flex: 1,
    fontSize: TYPOGRAPHY.fontSizes.md,
    marginLeft: SPACING.sm,
  },
  footer: {
    alignItems: 'center',
    paddingBottom: SPACING.xl,
    paddingHorizontal: SPACING.xl,
  },
  footerText: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSizes.sm,
    textAlign: 'center',
  },
  header: {
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderBottomColor: COLORS.borderLight,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  headerTitle: {
    color: COLORS.text,
    fontSize: TYPOGRAPHY.fontSizes.xl,
    fontWeight: TYPOGRAPHY.fontWeights.semibold,
  },
  iconContainer: {
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 60,
    elevation: 4,
    height: 120,
    justifyContent: 'center',
    marginBottom: SPACING.xl,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    width: 120,
  },
  infoContainer: {
    alignItems: 'center',
    backgroundColor: COLORS.warningLight,
    borderRadius: BORDER_RADIUS.md,
    flexDirection: 'row',
    marginTop: SPACING.xl,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  infoText: {
    color: COLORS.info,
    flex: 1,
    fontSize: TYPOGRAPHY.fontSizes.sm,
    marginLeft: SPACING.sm,
    textAlign: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    marginVertical: SPACING.xl,
  },
  loadingText: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSizes.md,
    marginTop: SPACING.md,
  },
  mainContent: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
  },
  retryButton: {
    marginTop: SPACING.lg,
    minWidth: 120,
  },
  skipButton: {
    padding: SPACING.sm,
  },
  skipText: {
    color: COLORS.primary,
    fontSize: TYPOGRAPHY.fontSizes.md,
    fontWeight: TYPOGRAPHY.fontWeights.medium,
  },
  title: {
    color: COLORS.text,
    fontSize: TYPOGRAPHY.fontSizes['2xl'],
    fontWeight: TYPOGRAPHY.fontWeights.bold,
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
  webDemoContainer: {
    alignItems: 'center',
    backgroundColor: COLORS.infoLight,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  webDemoText: {
    color: COLORS.info,
    fontSize: TYPOGRAPHY.fontSizes.sm,
    marginTop: SPACING.sm,
    textAlign: 'center',
  },
  webDemoTitle: {
    color: COLORS.text,
    fontSize: TYPOGRAPHY.fontSizes.lg,
    fontWeight: TYPOGRAPHY.fontWeights.semibold,
    marginTop: SPACING.sm,
  },
});

export default PhoneUnlockScreen;