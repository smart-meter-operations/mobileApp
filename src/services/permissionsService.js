import * as Location from 'expo-location';
import { Camera } from 'expo-camera';
import { Alert } from 'react-native';

class PermissionsService {
  constructor() {
    this.permissions = {
      camera: null,
      location: null,
    };
  }

  // Request camera permission
  async requestCameraPermission() {
    try {
      const { status } = await Camera.requestCameraPermissionsAsync();
      this.permissions.camera = status;

      console.log('Camera permission status:', status);

      return {
        granted: status === 'granted',
        status,
        canAskAgain: status !== 'denied',
      };
    } catch (error) {
      console.error('Request camera permission failed:', error);
      return {
        granted: false,
        status: 'error',
        canAskAgain: false,
        error: error.message,
      };
    }
  }

  // Request location permission
  async requestLocationPermission() {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      this.permissions.location = status;

      console.log('Location permission status:', status);

      return {
        granted: status === 'granted',
        status,
        canAskAgain: status !== 'denied',
      };
    } catch (error) {
      console.error('Request location permission failed:', error);
      return {
        granted: false,
        status: 'error',
        canAskAgain: false,
        error: error.message,
      };
    }
  }

  // Check camera permission status
  async checkCameraPermission() {
    try {
      const { status } = await Camera.getCameraPermissionsAsync();
      this.permissions.camera = status;

      return {
        granted: status === 'granted',
        status,
        canAskAgain: status !== 'denied',
      };
    } catch (error) {
      console.error('Check camera permission failed:', error);
      return {
        granted: false,
        status: 'error',
        canAskAgain: false,
      };
    }
  }

  // Check location permission status
  async checkLocationPermission() {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      this.permissions.location = status;

      return {
        granted: status === 'granted',
        status,
        canAskAgain: status !== 'denied',
      };
    } catch (error) {
      console.error('Check location permission failed:', error);
      return {
        granted: false,
        status: 'error',
        canAskAgain: false,
      };
    }
  }

  // Request both camera and location permissions
  async requestCapturePermissions() {
    try {
      const [cameraResult, locationResult] = await Promise.all([
        this.requestCameraPermission(),
        this.requestLocationPermission(),
      ]);

      return {
        camera: cameraResult,
        location: locationResult,
        allGranted: cameraResult.granted && locationResult.granted,
      };
    } catch (error) {
      console.error('Request capture permissions failed:', error);
      return {
        camera: { granted: false, status: 'error' },
        location: { granted: false, status: 'error' },
        allGranted: false,
        error: error.message,
      };
    }
  }

  // Check both camera and location permissions
  async checkCapturePermissions() {
    try {
      const [cameraResult, locationResult] = await Promise.all([
        this.checkCameraPermission(),
        this.checkLocationPermission(),
      ]);

      return {
        camera: cameraResult,
        location: locationResult,
        allGranted: cameraResult.granted && locationResult.granted,
      };
    } catch (error) {
      console.error('Check capture permissions failed:', error);
      return {
        camera: { granted: false, status: 'error' },
        location: { granted: false, status: 'error' },
        allGranted: false,
        error: error.message,
      };
    }
  }

  // Show permission denied alert
  showPermissionDeniedAlert(permission, onRetry, onCancel) {
    const permissionName = permission === 'camera' ? 'Camera' : 'Location';

    Alert.alert(
      `${permissionName} Permission Required`,
      `This feature requires ${permissionName.toLowerCase()} access. Please grant permission to continue.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: onCancel,
        },
        {
          text: 'Retry',
          onPress: onRetry,
        },
        {
          text: 'Settings',
          onPress: () => {
            // Open app settings - this would need to be implemented per platform
            console.log('Open app settings for permission');
          },
        },
      ]
    );
  }

  // Handle permission flow for capture feature
  async handleCapturePermissions(onSuccess, onFailure) {
    try {
      // First check existing permissions
      const permissionStatus = await this.checkCapturePermissions();

      if (permissionStatus.allGranted) {
        onSuccess();
        return;
      }

      // Request missing permissions
      const requestResult = await this.requestCapturePermissions();

      if (requestResult.allGranted) {
        onSuccess();
        return;
      }

      // Handle permission denials
      let deniedPermissions = [];

      if (!requestResult.camera.granted) {
        deniedPermissions.push('camera');
      }

      if (!requestResult.location.granted) {
        deniedPermissions.push('location');
      }

      if (deniedPermissions.length > 0) {
        const permissionText = deniedPermissions.join(' and ');

        Alert.alert(
          'Permissions Required',
          `Camera and location permissions are required for the Capture feature. Please grant ${permissionText} permission(s) to continue.`,
          [
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () => onFailure('Permissions denied'),
            },
            {
              text: 'Retry',
              onPress: () =>
                this.handleCapturePermissions(onSuccess, onFailure),
            },
          ]
        );
      }
    } catch (error) {
      console.error('Handle capture permissions failed:', error);
      onFailure(error.message);
    }
  }

  // Get current permission status for all permissions
  async getAllPermissionStatus() {
    try {
      const [cameraStatus, locationStatus] = await Promise.all([
        this.checkCameraPermission(),
        this.checkLocationPermission(),
      ]);

      return {
        camera: cameraStatus,
        location: locationStatus,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Get all permission status failed:', error);
      return {
        camera: { granted: false, status: 'error' },
        location: { granted: false, status: 'error' },
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  // Check if permission can be requested (not permanently denied)
  canRequestPermission(permissionResult) {
    return permissionResult.canAskAgain && permissionResult.status !== 'denied';
  }

  // Get user-friendly permission status message
  getPermissionStatusMessage(permission, status) {
    switch (status) {
      case 'granted':
        return `${permission} access granted`;
      case 'denied':
        return `${permission} access denied. Please enable in settings.`;
      case 'undetermined':
        return `${permission} permission not requested yet`;
      default:
        return `${permission} permission status unknown`;
    }
  }
}

// Export singleton instance
export default new PermissionsService();
