import * as Network from 'expo-network';
import NetInfo from '@react-native-community/netinfo';

class NetworkService {
  constructor() {
    this.networkState = null;
    this.listeners = [];
  }

  // Initialize network monitoring
  async initialize() {
    try {
      // Get initial network state
      this.networkState = await this.getNetworkState();

      // Set up network state listener
      const unsubscribe = NetInfo.addEventListener((state) => {
        this.networkState = {
          isConnected: state.isConnected,
          type: state.type,
          isInternetReachable: state.isInternetReachable,
          details: state.details,
        };

        // Notify listeners
        this.listeners.forEach((listener) => {
          try {
            listener(this.networkState);
          } catch (error) {
            console.error('Network listener error:', error);
          }
        });
      });

      console.log('NetworkService initialized successfully');
      return { success: true, unsubscribe };
    } catch (error) {
      console.error('NetworkService initialization failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Get current network state
  async getNetworkState() {
    try {
      const [networkState, networkInfo] = await Promise.all([
        NetInfo.fetch(),
        Network.getNetworkStateAsync(),
      ]);

      return {
        isConnected: networkState.isConnected,
        isInternetReachable: networkState.isInternetReachable,
        type: networkState.type, // wifi, cellular, none, unknown
        details: networkState.details,
        expo: {
          type: networkInfo.type,
          isConnected: networkInfo.isConnected,
          isInternetReachable: networkInfo.isInternetReachable,
        },
      };
    } catch (error) {
      console.error('Get network state failed:', error);
      return {
        isConnected: false,
        isInternetReachable: false,
        type: 'unknown',
        details: {},
        error: error.message,
      };
    }
  }

  // Get detailed network information
  async getDetailedNetworkInfo() {
    try {
      const networkState = await this.getNetworkState();
      const ipAddress = await Network.getIpAddressAsync();

      let detailedInfo = {
        ...networkState,
        ipAddress,
        timestamp: new Date().toISOString(),
      };

      // Add connection-specific details
      if (networkState.type === 'wifi' && networkState.details) {
        detailedInfo.wifi = {
          ssid: networkState.details.ssid,
          bssid: networkState.details.bssid,
          strength: networkState.details.strength,
          frequency: networkState.details.frequency,
          linkSpeed: networkState.details.linkSpeed,
          ipAddress: networkState.details.ipAddress,
          subnet: networkState.details.subnet,
          isConnectionExpensive: networkState.details.isConnectionExpensive,
        };
      }

      if (networkState.type === 'cellular' && networkState.details) {
        detailedInfo.cellular = {
          carrier: networkState.details.carrier,
          cellularGeneration: networkState.details.cellularGeneration,
          isConnectionExpensive: networkState.details.isConnectionExpensive,
        };
      }

      return detailedInfo;
    } catch (error) {
      console.error('Get detailed network info failed:', error);
      return {
        isConnected: false,
        type: 'unknown',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  // Measure connection speed (simple implementation)
  async measureConnectionSpeed() {
    try {
      if (!this.networkState?.isConnected) {
        return {
          downloadSpeed: 0,
          quality: 'No Connection',
          timestamp: new Date().toISOString(),
        };
      }

      const startTime = Date.now();
      const testUrl = 'https://httpbin.org/bytes/50000'; // 50KB test file

      try {
        const response = await fetch(testUrl);
        const endTime = Date.now();
        const duration = (endTime - startTime) / 1000; // seconds
        const sizeBytes = 50000; // 50KB
        const speedKbps = (sizeBytes * 8) / (duration * 1000); // Kbps
        const speedMbps = speedKbps / 1000; // Mbps

        let quality = 'Poor';
        if (speedMbps > 5) quality = 'Excellent';
        else if (speedMbps > 2) quality = 'Good';
        else if (speedMbps > 0.5) quality = 'Fair';

        return {
          downloadSpeed: speedMbps.toFixed(2),
          speedKbps: speedKbps.toFixed(2),
          duration: duration.toFixed(2),
          quality,
          timestamp: new Date().toISOString(),
        };
      } catch (fetchError) {
        // If test URL fails, return basic connection info
        return {
          downloadSpeed: 'Unknown',
          quality: this.networkState.isInternetReachable
            ? 'Connected'
            : 'Limited',
          error: 'Speed test failed',
          timestamp: new Date().toISOString(),
        };
      }
    } catch (error) {
      console.error('Measure connection speed failed:', error);
      return {
        downloadSpeed: 0,
        quality: 'Error',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  // Get signal strength information (cellular only)
  getSignalStrength() {
    try {
      if (!this.networkState) {
        return { strength: 'Unknown', bars: 0, quality: 'Unknown' };
      }

      // Only capture signal strength for cellular connections
      if (this.networkState.type === 'cellular') {
        // For cellular, we can't get exact signal strength via Expo
        // Return basic connection quality
        return {
          strength: 'Available',
          bars: this.networkState.isInternetReachable ? 3 : 1,
          quality: this.networkState.isInternetReachable ? 'Good' : 'Poor',
          type: 'cellular',
          generation:
            this.networkState.details?.cellularGeneration || 'Unknown',
        };
      }

      // For WiFi and other connection types, don't capture signal strength
      return {
        strength: 'N/A',
        bars: 0,
        quality: 'Not Applicable',
        type: this.networkState.type,
        note: 'Signal strength only available for cellular connections',
      };
    } catch (error) {
      console.error('Get signal strength failed:', error);
      return {
        strength: 'Error',
        bars: 0,
        quality: 'Error',
        error: error.message,
      };
    }
  }

  // Get comprehensive network info for capture
  async getCaptureNetworkInfo() {
    try {
      const [detailedInfo, speedInfo] = await Promise.all([
        this.getDetailedNetworkInfo(),
        this.measureConnectionSpeed(),
      ]);

      const signalInfo = this.getSignalStrength();

      return {
        connection: {
          type: detailedInfo.type,
          isConnected: detailedInfo.isConnected,
          isInternetReachable: detailedInfo.isInternetReachable,
          ipAddress: detailedInfo.ipAddress,
        },
        signal: signalInfo,
        speed: speedInfo,
        details: detailedInfo.wifi || detailedInfo.cellular || {},
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Get capture network info failed:', error);
      return {
        connection: {
          type: 'unknown',
          isConnected: false,
          isInternetReachable: false,
          ipAddress: null,
        },
        signal: { strength: 'Error', bars: 0, quality: 'Error' },
        speed: { downloadSpeed: 0, quality: 'Error' },
        details: {},
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  // Add network state listener
  addNetworkListener(callback) {
    this.listeners.push(callback);

    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // Remove all listeners
  removeAllListeners() {
    this.listeners = [];
  }

  // Check if online
  isOnline() {
    return (
      this.networkState?.isConnected && this.networkState?.isInternetReachable
    );
  }

  // Check if expensive connection (cellular data)
  isExpensiveConnection() {
    return (
      this.networkState?.details?.isConnectionExpensive ||
      this.networkState?.type === 'cellular'
    );
  }

  // Get connection type
  getConnectionType() {
    return this.networkState?.type || 'unknown';
  }

  // Get user-friendly connection status
  getConnectionStatus() {
    if (!this.networkState) {
      return 'Unknown';
    }

    if (!this.networkState.isConnected) {
      return 'Offline';
    }

    if (!this.networkState.isInternetReachable) {
      return 'Limited Connection';
    }

    switch (this.networkState.type) {
      case 'wifi':
        return 'WiFi Connected';
      case 'cellular':
        return 'Mobile Data';
      case 'ethernet':
        return 'Ethernet Connected';
      default:
        return 'Connected';
    }
  }
}

// Export singleton instance
export default new NetworkService();
