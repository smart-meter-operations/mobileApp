import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
  StatusBar
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

// Import services and components
import { Button } from '../components';
import { DataService, PhoneUnlockService, DatabaseService } from '../services';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../constants';

const UserProfileScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const [user, setUser] = useState(null);
  const [authInfo, setAuthInfo] = useState(null);
  const [syncStats, setSyncStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      
      // Initialize database service first
      await DatabaseService.initialize();
      
      // Load user data
      const userData = await DataService.getUserProfile();
      setUser(userData);

      // Get authentication info
      const authData = await PhoneUnlockService.getAuthenticationInfo();
      setAuthInfo(authData);

      // Get sync statistics
      const syncData = await getSyncStatistics();
      setSyncStats(syncData);

    } catch (error) {
      console.error('Load user profile failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSyncStatistics = async () => {
    try {
      const [
        installationsCount,
        capturesCount,
        syncQueueCount
      ] = await Promise.all([
        DatabaseService.getTableCount('installations'),
        DatabaseService.getTableCount('captures'),
        DatabaseService.getSyncQueue()
      ]);

      return {
        installations: installationsCount,
        captures: capturesCount,
        pendingSync: syncQueueCount.length,
        lastSync: new Date().toISOString() // This would come from actual sync service
      };
    } catch (error) {
      console.error('Get sync statistics failed:', error);
      return {
        installations: 0,
        captures: 0,
        pendingSync: 0,
        lastSync: null
      };
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: performSignOut
        }
      ]
    );
  };

  const performSignOut = async () => {
    try {
      // Clear authentication data
      await PhoneUnlockService.clearAuthenticationData();
      
      // Navigate back to login
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (error) {
      console.error('Sign out failed:', error);
      Alert.alert('Error', 'Failed to sign out. Please try again.');
    }
  };

  const handleSyncData = async () => {
    Alert.alert(
      'Sync Data',
      'This will sync all pending data with the server. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sync',
          onPress: () => {
            Alert.alert('Info', 'Sync functionality will be implemented with API integration.');
          }
        }
      ]
    );
  };

  const handleClearLocalData = () => {
    Alert.alert(
      'Clear Local Data',
      'This will permanently delete all local data. This action cannot be undone. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: performClearData
        }
      ]
    );
  };

  const performClearData = async () => {
    try {
      await DatabaseService.clearAllData();
      Alert.alert('Success', 'Local data cleared successfully.');
      navigation.goBack();
    } catch (error) {
      console.error('Clear data failed:', error);
      Alert.alert('Error', 'Failed to clear data. Please try again.');
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  const getAuthStatusText = () => {
    if (!authInfo) return 'Unknown';
    
    if (authInfo.biometricSupport.isSupported) {
      return `Biometric (${authInfo.availableTypes.join(', ')})`;
    } else if (authInfo.biometricSupport.hasHardware) {
      return 'PIN/Pattern (No biometric enrolled)';
    } else {
      return 'PIN/Pattern (No biometric hardware)';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.surface} />
      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + SPACING.xl }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* User Info Section */}
        <View style={styles.section}>
          <View style={styles.userHeader}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.avatar || '👨‍💼'}
              </Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{user?.name || 'Rajesh'}</Text>
              <Text style={styles.userRole}>{user?.role || 'Surveyor / Installer'}</Text>
              <Text style={styles.userPhone}>{user?.phone || '+91 9876543210'}</Text>
            </View>
          </View>
        </View>

        {/* Authentication Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔐 Authentication</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Method:</Text>
            <Text style={styles.infoValue}>{getAuthStatusText()}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Recently Authenticated:</Text>
            <Text style={[
              styles.infoValue,
              { color: authInfo?.recentlyAuthenticated ? COLORS.success : COLORS.textSecondary }
            ]}>
              {authInfo?.recentlyAuthenticated ? 'Yes' : 'No'}
            </Text>
          </View>
        </View>

        {/* Data & Sync Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Data & Sync</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Installations:</Text>
            <Text style={styles.infoValue}>{syncStats?.installations || 0}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Captures:</Text>
            <Text style={styles.infoValue}>{syncStats?.captures || 0}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Pending Sync:</Text>
            <Text style={[
              styles.infoValue,
              { color: (syncStats?.pendingSync || 0) > 0 ? COLORS.warning : COLORS.success }
            ]}>
              {syncStats?.pendingSync || 0}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Last Sync:</Text>
            <Text style={styles.infoValue}>{formatDateTime(syncStats?.lastSync)}</Text>
          </View>
        </View>

        {/* Actions Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚙️ Actions</Text>
          
          <Button
            title="Sync Data"
            onPress={handleSyncData}
            style={styles.actionButton}
            disabled={!syncStats?.pendingSync}
          />
          
          <Button
            title="Clear Local Data"
            onPress={handleClearLocalData}
            style={[styles.actionButton, styles.dangerButton]}
          />
        </View>

        {/* Sign Out */}
        <View style={styles.section}>
          <Button
            title="Sign Out"
            onPress={handleSignOut}
            style={[styles.actionButton, styles.signOutButton]}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: SPACING.xl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: TYPOGRAPHY.fontSizes.lg,
    color: COLORS.textSecondary,
  },
  scrollContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    paddingTop: SPACING.lg,
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
  headerSpacer: {
    width: 40,
  },
  section: {
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.lg,
    marginVertical: SPACING.sm,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    elevation: 2,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSizes.lg,
    fontWeight: TYPOGRAPHY.fontWeights.semibold,
    color: COLORS.text,
    marginBottom: SPACING.lg,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.lg,
  },
  avatarText: {
    fontSize: TYPOGRAPHY.fontSizes['2xl'],
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: TYPOGRAPHY.fontSizes.xl,
    fontWeight: TYPOGRAPHY.fontWeights.semibold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  userRole: {
    fontSize: TYPOGRAPHY.fontSizes.md,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  userPhone: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.textSecondary,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  infoLabel: {
    fontSize: TYPOGRAPHY.fontSizes.md,
    color: COLORS.textSecondary,
    flex: 1,
  },
  infoValue: {
    fontSize: TYPOGRAPHY.fontSizes.md,
    color: COLORS.text,
    fontWeight: TYPOGRAPHY.fontWeights.medium,
    flex: 1,
    textAlign: 'right',
  },
  actionButton: {
    marginBottom: SPACING.md,
  },
  dangerButton: {
    backgroundColor: COLORS.error,
  },
  signOutButton: {
    backgroundColor: COLORS.textSecondary,
  },
});

export default UserProfileScreen;