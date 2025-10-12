// Remote logging utility for physical devices
import * as Device from 'expo-device';

class RemoteLogger {
  constructor() {
    this.logs = [];
    this.deviceInfo = null;
    this.initDeviceInfo();
  }

  async initDeviceInfo() {
    this.deviceInfo = {
      deviceName: Device.deviceName,
      modelName: Device.modelName,
      osName: Device.osName,
      osVersion: Device.osVersion,
      platform: Device.platformApiLevel,
    };
  }

  // Send logs to a remote endpoint (you can use your own server or services like LogRocket)
  async sendLogs(logs) {
    try {
      // Example: Send to your own logging endpoint
      const response = await fetch('https://your-logging-endpoint.com/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          device: this.deviceInfo,
          timestamp: new Date().toISOString(),
          logs: logs,
        }),
      });
      
      if (response.ok) {
        console.log('Logs sent successfully');
      }
    } catch (error) {
      // Fail silently to avoid infinite loops
    }
  }

  // Log with context
  logWithContext(level, message, context = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      device: this.deviceInfo,
    };

    this.logs.push(logEntry);
    
    // Send logs in batches of 10
    if (this.logs.length >= 10) {
      this.sendLogs([...this.logs]);
      this.logs = [];
    }

    // Also log to console
    console[level] ? console[level](message, context) : console.log(message, context);
  }

  info(message, context) {
    this.logWithContext('info', message, context);
  }

  error(message, context) {
    this.logWithContext('error', message, context);
  }

  warn(message, context) {
    this.logWithContext('warn', message, context);
  }

  debug(message, context) {
    this.logWithContext('log', message, context);
  }
}

export default new RemoteLogger();
