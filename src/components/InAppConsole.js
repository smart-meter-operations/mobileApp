import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Dimensions,
  Alert,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants';

const { width, height } = Dimensions.get('window');

class InAppConsole {
  constructor() {
    this.logs = [];
    this.listeners = [];
    this.maxLogs = 100; // Keep only last 100 logs
    
    // Override console methods
    this.originalConsole = {
      log: console.log,
      error: console.error,
      warn: console.warn,
      info: console.info,
    };
    
    this.setupConsoleOverride();
  }
  
  setupConsoleOverride() {
    const addLog = (level, args) => {
      // Prevent processing during React render phase
      if (typeof window !== 'undefined' && window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
        // Use setTimeout to defer processing until after render
        setTimeout(() => this.processLog(level, args), 0);
        return;
      }
      this.processLog(level, args);
    };
    
    this.processLog = (level, args) => {
      const timestamp = new Date().toLocaleTimeString();
      const fullTimestamp = new Date().toISOString();
      
      // Process arguments to extract JSON objects
      const processedArgs = args.map(arg => {
        if (typeof arg === 'object' && arg !== null) {
          try {
            return {
              type: 'json',
              raw: arg,
              formatted: JSON.stringify(arg, null, 2)
            };
          } catch (e) {
            return {
              type: 'object',
              raw: arg,
              formatted: String(arg)
            };
          }
        }
        return {
          type: 'string',
          raw: arg,
          formatted: String(arg)
        };
      });
      
      const message = processedArgs.map(item => item.formatted).join(' ');
      
      // Detect API-related logs
      const isApiLog = message.includes('API') || 
                      message.includes('🚀') || 
                      message.includes('🎯') || 
                      message.includes('📤') || 
                      message.includes('📥') ||
                      message.includes('PUT') ||
                      message.includes('POST') ||
                      message.includes('Response');
      
      const logEntry = {
        id: Date.now() + Math.random(),
        timestamp,
        fullTimestamp,
        level,
        message,
        processedArgs,
        isApiLog,
        copyable: processedArgs.some(arg => arg.type === 'json'),
      };
      
      this.logs.push(logEntry);
      
      // Keep only recent logs
      if (this.logs.length > this.maxLogs) {
        this.logs = this.logs.slice(-this.maxLogs);
      }
      
      // Notify listeners asynchronously to avoid setState during render
      setTimeout(() => {
        this.listeners.forEach(listener => listener(this.logs));
      }, 0);
    };
    
    console.log = (...args) => {
      this.originalConsole.log(...args);
      addLog('log', args);
    };
    
    console.error = (...args) => {
      this.originalConsole.error(...args);
      addLog('error', args);
    };
    
    console.warn = (...args) => {
      this.originalConsole.warn(...args);
      addLog('warn', args);
    };
    
    console.info = (...args) => {
      this.originalConsole.info(...args);
      addLog('info', args);
    };
  }
  
  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }
  
  getLogs() {
    return this.logs;
  }
  
  clear() {
    this.logs = [];
    setTimeout(() => {
      this.listeners.forEach(listener => listener(this.logs));
    }, 0);
  }
}

// Global instance
const inAppConsole = new InAppConsole();

// React component
const InAppConsoleComponent = ({ visible, onClose }) => {
  const [scrollViewRef, setScrollViewRef] = useState(null);
  const [logs, setLogs] = useState(inAppConsole.getLogs());
  const [filter, setFilter] = useState('all');
  const [expandedLogs, setExpandedLogs] = useState(new Set());
  
  useEffect(() => {
    const unsubscribe = inAppConsole.subscribe(setLogs);
    return unsubscribe;
  }, []);

  
  const filteredLogs = logs.filter(log => {
    if (filter === 'all') return true;
    if (filter === 'error') return log.level === 'error';
    if (filter === 'api') return log.isApiLog;
    if (filter === 'gps') return log.message.includes('GPS') || log.message.includes('📍');
    if (filter === 'sim') return log.message.includes('SIM') || log.message.includes('📶');
    return true;
  });
  
  const getLogColor = (level) => {
    switch (level) {
      case 'error': return COLORS.error;
      case 'warn': return COLORS.warning;
      case 'info': return COLORS.info;
      default: return COLORS.textPrimary;
    }
  };
  
  const toggleLogExpansion = (logId) => {
    setExpandedLogs(prev => {
      const newSet = new Set(prev);
      newSet.has(logId) ? newSet.delete(logId) : newSet.add(logId);
      return newSet;
    });
  };
  const copyToClipboard = async (text, label = 'Log') => {
    try {
      await Clipboard.setStringAsync(text);
      Alert.alert('Copied!', `${label} copied to clipboard`);
    } catch (error) {
      Alert.alert('Error', 'Failed to copy to clipboard');
    }
  };
  
  const copyJsonFromLog = (log) => {
    const jsonArgs = log.processedArgs.filter(arg => arg.type === 'json');
    if (jsonArgs.length > 0) {
      const jsonText = jsonArgs.map(arg => arg.formatted).join('\n\n');
      copyToClipboard(jsonText, 'JSON');
    }
  };

  const copyFullLog = (log) => {
    if (log) {
      const logText = `[${log.fullTimestamp}] ${log.level.toUpperCase()}\n${log.message}`;
      copyToClipboard(logText, 'Full Log');
    }
  };
  
  const copyAllLogs = async () => {
    try {
      const allLogsText = filteredLogs.map(log =>
        `[${log.fullTimestamp}] ${log.level.toUpperCase()}\n${log.message}\n`
      ).join('\n');
      await Clipboard.setStringAsync(allLogsText);
      Alert.alert('Copied!', 'All filtered logs copied to clipboard');
    } catch (error) {
      Alert.alert('Error', 'Failed to copy logs to clipboard');
    }
  };
  
  const scrollToBottom = () => {
    if (scrollViewRef) {
      scrollViewRef.scrollToEnd({ animated: true });
    }
  };
  
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.container, !visible && { pointerEvents: 'none' }]}>
        <View style={styles.header}>
          <Text style={styles.title}>In-App Console ({filteredLogs.length} logs)</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.filterContainer}>
          {['all', 'api', 'gps', 'sim', 'error'].map(filterType => (
            <TouchableOpacity
              key={filterType}
              style={[
                styles.filterButton,
                filter === filterType && styles.filterButtonActive
              ]}
              onPress={() => setFilter(filterType)}
            >
              <Text style={[
                styles.filterText,
                filter === filterType && styles.filterTextActive
              ]}>
                {filterType.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => inAppConsole.clear()}
          >
            <Text style={styles.clearText}>CLEAR</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.copyAllButton}
            onPress={copyAllLogs}
          >
            <Text style={styles.copyAllText}>COPY ALL</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.scrollToBottomButton}
            onPress={scrollToBottom}
          >
            <Text style={styles.scrollToBottomText}>⬇️</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView 
          ref={(ref) => setScrollViewRef(ref)}
          style={styles.logContainer}
          showsVerticalScrollIndicator={true}
        >
          {filteredLogs.map(log => {
            const isExpanded = expandedLogs.has(log.id);
            const hasJson = log.copyable;
            
            return (
              <View key={log.id} style={styles.logEntry}>
                <View style={styles.logHeader}>
                  <Text style={styles.timestamp}>{log.timestamp}</Text>
                  <View style={styles.logActions}>
                    {hasJson && (
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => copyJsonFromLog(log)}
                      >
                        <Text style={styles.actionButtonText}>📋 JSON</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => copyFullLog(log)}
                    >
                      <Text style={styles.actionButtonText}>📄 COPY</Text>
                    </TouchableOpacity>
                    {hasJson && (
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => toggleLogExpansion(log.id)}
                      >
                        <Text style={styles.actionButtonText}>
                          {isExpanded ? '🔼' : '🔽'}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
                
                <Text style={[styles.logText, { color: getLogColor(log.level) }]}>
                  {log.message}
                </Text>
                
                {hasJson && isExpanded && (
                  <View style={styles.jsonContainer}>
                    {log.processedArgs
                      .filter(arg => arg.type === 'json')
                      .map((arg, index) => (
                        <View key={index} style={styles.jsonBlock}>
                          <TouchableOpacity
                            style={styles.jsonCopyButton}
                            onPress={() => copyToClipboard(arg.formatted, `JSON Block ${index + 1}`)}
                          >
                            <Text style={styles.jsonCopyText}>📋 Copy JSON</Text>
                          </TouchableOpacity>
                          <ScrollView horizontal showsHorizontalScrollIndicator={true}>
                            <Text style={styles.jsonText}>{arg.formatted}</Text>
                          </ScrollView>
                        </View>
                      ))}
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    paddingTop: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  title: {
    color: '#fff',
    fontSize: TYPOGRAPHY.fontSizes.lg,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: SPACING.sm,
  },
  closeText: {
    color: '#fff',
    fontSize: TYPOGRAPHY.fontSizes.xl,
  },
  filterContainer: {
    flexDirection: 'row',
    padding: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  filterButton: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    marginRight: SPACING.xs,
    borderRadius: 4,
    backgroundColor: '#333',
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary,
  },
  filterText: {
    color: '#ccc',
    fontSize: TYPOGRAPHY.fontSizes.sm,
  },
  filterTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  clearButton: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    marginLeft: 'auto',
    borderRadius: 4,
    backgroundColor: COLORS.error,
  },
  copyAllButton: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    marginLeft: SPACING.xs,
    borderRadius: 4,
    backgroundColor: COLORS.success,
  },
  scrollToBottomButton: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    marginLeft: SPACING.xs,
    borderRadius: 4,
    backgroundColor: COLORS.info,
  },
  scrollToBottomText: {
    color: '#fff',
    fontSize: TYPOGRAPHY.fontSizes.sm,
    fontWeight: 'bold',
  },
  logContainer: {
    flex: 1,
    padding: SPACING.sm,
  },
  logEntry: {
    marginBottom: SPACING.sm,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  logActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    backgroundColor: '#333',
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    marginLeft: SPACING.xs,
    borderRadius: 4,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: TYPOGRAPHY.fontSizes.xs,
  },
  timestamp: {
    color: '#888',
    fontSize: TYPOGRAPHY.fontSizes.xs,
  },
  logText: {
    color: '#fff',
    fontSize: TYPOGRAPHY.fontSizes.sm,
    fontFamily: 'monospace',
  },
  jsonContainer: {
    marginTop: SPACING.sm,
    backgroundColor: '#111',
    borderRadius: 4,
    padding: SPACING.sm,
  },
  jsonBlock: {
    marginBottom: SPACING.sm,
  },
  jsonCopyButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: SPACING.xs,
  },
  jsonCopyText: {
    color: '#fff',
    fontSize: TYPOGRAPHY.fontSizes.xs,
    fontWeight: 'bold',
  },
  jsonText: {
    color: '#0f0',
    fontSize: TYPOGRAPHY.fontSizes.xs,
    fontFamily: 'monospace',
    backgroundColor: '#000',
    padding: SPACING.sm,
    borderRadius: 4,
    minWidth: width - 40,
  },
});

export { InAppConsoleComponent, inAppConsole };
export default InAppConsoleComponent;
