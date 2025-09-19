import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';

class PhoneUnlockService {
  constructor() {
    this.isInitialized = false;
  }

  // Initialize the service
  async initialize() {
    try {
      this.isInitialized = true;
      console.log('PhoneUnlockService initialized');
      return true;
    } catch (error) {
      console.error('PhoneUnlockService initialization failed:', error);
      return false;
    }
  }

  // Check if device supports biometric authentication
  async isBiometricSupported() {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      return {
        hasHardware,
        isEnrolled,
        isSupported: hasHardware && isEnrolled,
      };
    } catch (error) {
      console.error('Biometric support check failed:', error);
      return {
        hasHardware: false,
        isEnrolled: false,
        isSupported: false,
      };
    }
  }

  // Get available authentication types
  async getAvailableAuthenticationTypes() {
    try {
      const types =
        await LocalAuthentication.supportedAuthenticationTypesAsync();
      const authTypes = [];

      types.forEach((type) => {
        switch (type) {
          case LocalAuthentication.AuthenticationType.FINGERPRINT:
            authTypes.push('fingerprint');
            break;
          case LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION:
            authTypes.push('faceId');
            break;
          case LocalAuthentication.AuthenticationType.IRIS:
            authTypes.push('iris');
            break;
        }
      });

      return authTypes;
    } catch (error) {
      console.error('Get authentication types failed:', error);
      return [];
    }
  }

  // Authenticate using biometrics
  async authenticateWithBiometrics() {
    try {
      const biometricSupport = await this.isBiometricSupported();

      if (!biometricSupport.isSupported) {
        return {
          success: false,
          error: 'Biometric authentication not available',
          fallbackRequired: true,
        };
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock to continue',
        subTitleMessage: 'Use your biometric to authenticate',
        cancelLabel: 'Cancel',
        fallbackLabel: 'Use PIN/Pattern',
        disableDeviceFallback: false,
      });

      if (result.success) {
        await this.saveAuthenticationSuccess('biometric');
        return {
          success: true,
          method: 'biometric',
          message: 'Biometric authentication successful',
        };
      } else {
        return {
          success: false,
          error: result.error || 'Biometric authentication failed',
          fallbackRequired: true,
        };
      }
    } catch (error) {
      console.error('Biometric authentication failed:', error);
      return {
        success: false,
        error: error.message,
        fallbackRequired: true,
      };
    }
  }

  // Authenticate using device PIN/Pattern
  async authenticateWithDeviceCredentials() {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock to continue',
        subTitleMessage: 'Use your device PIN or Pattern',
        cancelLabel: 'Cancel',
        fallbackLabel: '',
        disableDeviceFallback: false,
        requireConfirmation: false,
      });

      if (result.success) {
        await this.saveAuthenticationSuccess('device_credentials');
        return {
          success: true,
          method: 'device_credentials',
          message: 'Device authentication successful',
        };
      } else {
        return {
          success: false,
          error: result.error || 'Device authentication failed',
        };
      }
    } catch (error) {
      console.error('Device credentials authentication failed:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Main authentication method
  async authenticate() {
    try {
      const biometricSupport = await this.isBiometricSupported();

      if (biometricSupport.isSupported) {
        // Try biometric first
        const biometricResult = await this.authenticateWithBiometrics();

        if (biometricResult.success) {
          return biometricResult;
        } else if (biometricResult.fallbackRequired) {
          // Fallback to PIN/Pattern
          return await this.authenticateWithDeviceCredentials();
        } else {
          return biometricResult;
        }
      } else {
        // No biometric support, use PIN/Pattern
        return await this.authenticateWithDeviceCredentials();
      }
    } catch (error) {
      console.error('Authentication failed:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Save authentication success timestamp
  async saveAuthenticationSuccess(method) {
    try {
      const timestamp = new Date().toISOString();
      await AsyncStorage.setItem(
        'last_phone_unlock_auth',
        JSON.stringify({
          timestamp,
          method,
          success: true,
        })
      );
    } catch (error) {
      console.error('Save authentication success failed:', error);
    }
  }

  // Check if recently authenticated (within last 5 minutes)
  async isRecentlyAuthenticated() {
    try {
      const authData = await AsyncStorage.getItem('last_phone_unlock_auth');
      if (!authData) return false;

      const { timestamp } = JSON.parse(authData);
      const authTime = new Date(timestamp);
      const now = new Date();
      const diffMinutes = (now - authTime) / (1000 * 60);

      // Consider authenticated for 5 minutes
      return diffMinutes < 5;
    } catch (error) {
      console.error('Check recent authentication failed:', error);
      return false;
    }
  }

  // Clear authentication data
  async clearAuthenticationData() {
    try {
      await AsyncStorage.removeItem('last_phone_unlock_auth');
      console.log('Authentication data cleared');
    } catch (error) {
      console.error('Clear authentication data failed:', error);
    }
  }

  // Get authentication status info
  async getAuthenticationInfo() {
    try {
      const biometricSupport = await this.isBiometricSupported();
      const authTypes = await this.getAvailableAuthenticationTypes();
      const recentlyAuthenticated = await this.isRecentlyAuthenticated();

      return {
        biometricSupport,
        availableTypes: authTypes,
        recentlyAuthenticated,
        isAvailable:
          biometricSupport.isSupported || biometricSupport.hasHardware,
      };
    } catch (error) {
      console.error('Get authentication info failed:', error);
      return {
        biometricSupport: {
          hasHardware: false,
          isEnrolled: false,
          isSupported: false,
        },
        availableTypes: [],
        recentlyAuthenticated: false,
        isAvailable: false,
      };
    }
  }
}

// Export singleton instance
export default new PhoneUnlockService();
