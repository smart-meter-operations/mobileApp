import * as Network from 'expo-network';
import NetInfo from '@react-native-community/netinfo';
import * as Device from 'expo-device';

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

  // Get detailed SIM/cellular information for image capture
  async getDetailedCellularInfo() {
    try {
      const networkState = await this.getNetworkState();
      
      // Default values for all SIM fields
      const defaultSIMInfo = {
        sim1NetworkProvider: 'Unknown',
        sim1SignalStrength: 'Unknown',
        sim1SignalLevel: 'Unknown', 
        sim1SignalType: 'Unknown',
        sim1Category: 'Unknown',
        sim1RSSI: 'Unknown',
        sim1RSRP: 'Unknown',
        sim1SNR: 'Unknown',
        sim1CellId: 'Unknown',
      };

      // If not cellular connection, return defaults
      if (networkState.type !== 'cellular') {
        console.log('Not a cellular connection, returning default SIM info');
        return {
          ...defaultSIMInfo,
          sim1NetworkProvider: 'N/A - Not Cellular',
          sim1SignalType: networkState.type || 'Unknown',
        };
      }

      // Get available cellular details
      const cellularDetails = networkState.details || {};
      
      // Extract what information we can from NetInfo
      let simInfo = { ...defaultSIMInfo };
      
      if (cellularDetails.carrier) {
        simInfo.sim1NetworkProvider = cellularDetails.carrier;
      }
      
      if (cellularDetails.cellularGeneration) {
        simInfo.sim1SignalType = cellularDetails.cellularGeneration; // 2G, 3G, 4G, 5G
        simInfo.sim1Category = cellularDetails.cellularGeneration;
      }

      // Estimate signal strength based on connection quality
      if (networkState.isInternetReachable && networkState.isConnected) {
        if (cellularDetails.isConnectionExpensive === false) {
          // Good connection
          simInfo.sim1SignalStrength = 'Good';
          simInfo.sim1SignalLevel = 'High';
          simInfo.sim1RSSI = '-70'; // Estimated good signal
          simInfo.sim1RSRP = '-90'; // Estimated good signal
          simInfo.sim1SNR = '15'; // Estimated good SNR
        } else {
          // Average connection
          simInfo.sim1SignalStrength = 'Average';
          simInfo.sim1SignalLevel = 'Medium';
          simInfo.sim1RSSI = '-85'; // Estimated average signal
          simInfo.sim1RSRP = '-105'; // Estimated average signal
          simInfo.sim1SNR = '10'; // Estimated average SNR
        }
      } else if (networkState.isConnected) {
        // Poor connection
        simInfo.sim1SignalStrength = 'Poor';
        simInfo.sim1SignalLevel = 'Low';
        simInfo.sim1RSSI = '-100'; // Estimated poor signal
        simInfo.sim1RSRP = '-120'; // Estimated poor signal
        simInfo.sim1SNR = '5'; // Estimated poor SNR
      }

      // Generate a mock Cell ID based on available info
      if (cellularDetails.carrier) {
        // Create a consistent cell ID based on carrier name
        const carrierHash = cellularDetails.carrier.split('').reduce((a, b) => {
          a = ((a << 5) - a) + b.charCodeAt(0);
          return a & a;
        }, 0);
        simInfo.sim1CellId = Math.abs(carrierHash).toString().substring(0, 6);
      }

      console.log('Captured cellular info:', simInfo);
      return simInfo;
      
    } catch (error) {
      console.error('Get detailed cellular info failed:', error);
      return {
        sim1NetworkProvider: 'Error',
        sim1SignalStrength: 'Error',
        sim1SignalLevel: 'Error',
        sim1SignalType: 'Error', 
        sim1Category: 'Error',
        sim1RSSI: 'Error',
        sim1RSRP: 'Error',
        sim1SNR: 'Error',
        sim1CellId: 'Error',
      };
    }
  }

  // Get comprehensive network info for capture
  async getCaptureNetworkInfo() {
    try {
      const [detailedInfo, speedInfo, cellularInfo] = await Promise.all([
        this.getDetailedNetworkInfo(),
        this.measureConnectionSpeed(),
        this.getDetailedCellularInfo(),
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
        cellular: cellularInfo, // Add detailed cellular info
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
        cellular: {
          sim1NetworkProvider: 'Error',
          sim1SignalStrength: 'Error',
          sim1SignalLevel: 'Error',
          sim1SignalType: 'Error',
          sim1Category: 'Error',
          sim1RSSI: 'Error',
          sim1RSRP: 'Error',
          sim1SNR: 'Error',
          sim1CellId: 'Error',
        },
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
