import { Platform } from 'react-native';

// App Configuration Constants
export const APP_CONFIG = {
  name: 'WATTLY',
  companyName: '',
  version: '1.0.0',
};

// Screen Names
export const SCREENS = {
  LOGIN: 'Login',
  OTP: 'OTP',
  OTP_API: 'OTP_API',
  SUCCESS: 'Success',
  DASHBOARD: 'Dashboard',
  MAP: 'MapScreen',
  CONSUMER_INDEXING_FORM: 'ConsumerIndexingForm',
};

// Colors - ERPNext-like light theme with Material UI principles
export const COLORS = {
  // Primary colors (ERPNext inspired)
  primary: '#2b2b2b', // Dark grey for primary elements
  primaryDark: '#1a1a1a', // Darker grey
  primaryLight: '#404040', // Light grey
  secondary: '#666666', // Medium grey
  
  // ERPNext accent colors
  uberAccent: '#2b2b2b', // Dark grey accent
  uberGreen: '#4caf50', // Success green like ERPNext
  
  // Background colors (Light theme)
  background: '#f5f5f5', // Light grey background
  surface: '#ffffff', // White surface
  card: '#ffffff', // White card background
  white: '#ffffff',
  headerBackground: '#ffffff', // White header

  // Text colors (Dark text on light background)
  text: '#212121', // Dark text
  textPrimary: '#212121', // Primary dark text
  textSecondary: '#757575', // Medium grey text
  textMuted: '#9e9e9e', // Light grey text
  textLight: '#bdbdbd', // Very light grey text
  textWhite: '#ffffff',

  // Status colors (ERPNext inspired)
  success: '#4caf50', // Green
  successLight: '#e8f5e9', // Light green
  error: '#f44336', // Red
  errorLight: '#ffebee', // Light red
  warning: '#ff9800', // Orange
  warningLight: '#fff3e0', // Light orange
  info: '#2196f3', // Blue
  infoLight: '#e3f2fd', // Light blue

  // Border colors (Light theme)
  border: '#e0e0e0', // Light grey border
  borderLight: '#eeeeee', // Very light grey border
  borderActive: '#2b2b2b', // Dark grey active border
  gray: '#9e9e9e', // Medium grey

  // Shadow colors (Light theme)
  shadow: '#000000',
  shadowLight: '#f5f5f5',
  
  // Neumorphic colors (for ConsumerIndexingFormScreen only)
  neumorphic: {
    primary: '#E0E5EC', // Main background color (light, off-white grey)
    lightShadow: '#FFFFFF', // Light shadow color
    darkShadow: '#A3B1C6', // Dark shadow color
    textPrimary: '#3D3D3D', // Primary text color (dark grey)
    accent: '#4B72D3', // Accent color (muted blue)
  }
};

// Typography (Material UI inspired)
export const TYPOGRAPHY = {
  fontSizes: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
  },
  fontWeights: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  lineHeights: {
    tight: 1.2,
    normal: 1.4,
    relaxed: 1.6,
  },
  // Material UI font family
  fontFamily: {
    regular: 'Roboto-Regular',
    medium: 'Roboto-Medium',
    bold: 'Roboto-Bold',
  },
};

// Spacing (Material UI inspired)
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 64,
  '6xl': 80,
};

// Border Radius (Material UI inspired)
export const BORDER_RADIUS = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  '3xl': 24,
  full: 999,
};

// Animation Durations (Material UI inspired)
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
  baseUrl: process.env.API_BASE_URL || 'https://api.wattly.com',
  timeout: 10000,
  retryAttempts: 3,
  otpTimeout: 30000, // 30 seconds for OTP API calls
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