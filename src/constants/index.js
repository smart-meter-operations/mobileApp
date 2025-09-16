import { Platform } from 'react-native';

// App Configuration Constants
export const APP_CONFIG = {
  name: 'SmartGrid',
  companyName: 'Energy Corp.',
  version: '1.0.0',
};

// Screen Names
export const SCREENS = {
  LOGIN: 'Login',
  OTP: 'OTP', 
  SUCCESS: 'Success',
  DASHBOARD: 'Dashboard',
  MAP: 'MapScreen',
};

// Colors
export const COLORS = {
  // Primary colors
  primary: '#3b82f6',
  primaryDark: '#2563eb',
  primaryLight: '#60a5fa',
  
  // Background colors
  background: '#f8fafc',
  surface: '#ffffff',
  white: '#ffffff',
  headerBackground: '#334155',
  
  // Text colors
  text: '#1e293b',
  textPrimary: '#1e293b',
  textSecondary: '#64748b',
  textMuted: '#94a3b8',
  textLight: '#cbd5e1',
  textWhite: '#ffffff',
  
  // Status colors
  success: '#10b981',
  successLight: '#dcfce7',
  error: '#ef4444',
  errorLight: '#fecaca',
  warning: '#f59e0b',
  warningLight: '#fef3c7',
  info: '#06b6d4',
  infoLight: '#cffafe',
  
  // Border colors
  border: '#e2e8f0',
  borderLight: '#f1f5f9',
  borderActive: '#3b82f6',
  gray: '#6b7280',
  
  // Shadow colors
  shadow: '#1e293b',
  shadowLight: '#cbd5e1',
};

// Typography
export const TYPOGRAPHY = {
  fontSizes: {
    xs: 10,
    sm: 12,
    base: 14,
    lg: 16,
    xl: 18,
    '2xl': 20,
    '3xl': 22,
    '4xl': 24,
    '5xl': 32,
  },
  fontWeights: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  lineHeights: {
    tight: 20,
    normal: 22,
    relaxed: 24,
  },
};

// Spacing
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
  '6xl': 60,
};

// Border Radius
export const BORDER_RADIUS = {
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  '3xl': 24,
  full: 999,
};

// Animation Durations
export const ANIMATION = {
  fast: 150,
  normal: 300,
  slow: 600,
  stagger: {
    card: 200,
    listItem: 50,
    otpBox: 100,
  },
};

// API Configuration (for future use)
export const API_CONFIG = {
  baseUrl: process.env.API_BASE_URL || 'https://api.smartgrid.com',
  timeout: 10000,
  retryAttempts: 3,
};

// Device dimensions
export const DEVICE = {
  isIOS: Platform.OS === 'ios',
  isAndroid: Platform.OS === 'android',
};

// Status values
export const STATUS = {
  COMPLETED: 'completed',
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  CANCELLED: 'cancelled',
};

// Task types
export const TASK_TYPES = {
  SURVEY: 'survey',
  INSTALLATION: 'installation',
};