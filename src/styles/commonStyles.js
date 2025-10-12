import { StyleSheet } from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../constants';

// Common layout styles (Material UI inspired - Light theme)
export const layoutStyles = StyleSheet.create({
  centerContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  container: {
    backgroundColor: COLORS.background, // Light grey background
    flex: 1,
  },
  content: {
    backgroundColor: COLORS.surface, // White surface
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    elevation: 4, // Subtle elevation
    flex: 1,
    marginTop: -12,
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING['3xl'],
    // Enhanced layered shadow effects
    shadowColor: COLORS.shadow,
    shadowOffset: {
      width: 0,
      height: -4,
    },
    borderWidth: 0.5,
    shadowOpacity: 0.1,
    shadowRadius: 10,
    // Subtle border
    borderColor: COLORS.borderLight,
    borderTopWidth: 0,
  },
  formContainer: {
    flex: 1,
  },
  rowContainer: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flex: 1,
  },
  spaceBetween: {
    justifyContent: 'space-between',
  },
});

// Header styles (Material UI inspired - Light theme)
export const headerStyles = StyleSheet.create({
  header: {
    alignItems: 'center',
    justifyContent: 'center', // Center the content
    paddingBottom: SPACING['2xl'],
    paddingTop: SPACING['2xl'],
    backgroundColor: COLORS.headerBackground, // White background
    position: 'relative',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  logoContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center', // Center the logo
  },
  logoIcon: {
    alignItems: 'center',
    backgroundColor: COLORS.primary, // Dark grey for better visibility
    borderRadius: BORDER_RADIUS.md,
    height: 32,
    justifyContent: 'center',
    marginRight: SPACING.md,
    width: 32,
  },
  logoIconText: {
    color: COLORS.textWhite,
    fontSize: TYPOGRAPHY.fontSizes.lg,
    fontWeight: TYPOGRAPHY.fontWeights.bold,
  },
  logoText: {
    color: COLORS.textPrimary, // Dark text for better contrast
    fontSize: TYPOGRAPHY.fontSizes['4xl'],
    fontWeight: TYPOGRAPHY.fontWeights.bold,
    letterSpacing: 1, // Add letter spacing for Material UI feel
  },
});

// Typography styles (Material UI inspired - Light theme)
export const textStyles = StyleSheet.create({
  bodyText: {
    color: COLORS.textPrimary, // Dark text
    fontSize: TYPOGRAPHY.fontSizes.base,
    lineHeight: TYPOGRAPHY.lineHeights.normal,
  },
  caption: {
    color: COLORS.textSecondary, // Medium grey text
    fontSize: TYPOGRAPHY.fontSizes.sm,
  },
  footerText: {
    color: COLORS.textMuted, // Light grey text
    fontSize: TYPOGRAPHY.fontSizes.xs,
  },
  subtitle: {
    color: COLORS.textPrimary, // Darker for visibility
    fontSize: TYPOGRAPHY.fontSizes.lg,
    lineHeight: TYPOGRAPHY.lineHeights.relaxed,
    marginBottom: SPACING.xl,
  },
  title: {
    color: COLORS.textPrimary, // Dark text
    fontSize: TYPOGRAPHY.fontSizes['3xl'],
    fontWeight: TYPOGRAPHY.fontWeights.bold,
    marginBottom: SPACING.lg,
    letterSpacing: 0.5, // Add letter spacing for Material UI feel
  },
});

// Button styles (Material UI inspired - Light theme)
export const buttonStyles = StyleSheet.create({
  primaryButton: {
    alignItems: 'center',
    backgroundColor: COLORS.primary, // Dark grey background
    borderRadius: BORDER_RADIUS.md, // Material UI border radius
    elevation: 3, // Subtle elevation
    paddingVertical: SPACING.lg,
    shadowColor: COLORS.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1, // Subtle shadow
    shadowRadius: 4,
    minWidth: 120, // Minimum width for better touch targets
  },
  primaryButtonDisabled: {
    backgroundColor: COLORS.textMuted, // Grey when disabled
    elevation: 1, // Reduced elevation when disabled
  },
  primaryButtonText: {
    color: COLORS.textWhite, // White text for contrast
    fontSize: TYPOGRAPHY.fontSizes.lg,
    fontWeight: TYPOGRAPHY.fontWeights.medium, // Medium weight for Material UI
    letterSpacing: 0.5, // Add letter spacing
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: COLORS.surface, // White background
    borderColor: COLORS.border, // Light border
    borderRadius: BORDER_RADIUS.md, // Material UI border radius
    borderWidth: 1,
    elevation: 2, // Subtle elevation
    paddingVertical: SPACING.lg,
    shadowColor: COLORS.shadow,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    minWidth: 120, // Minimum width for better touch targets
  },
  secondaryButtonText: {
    color: COLORS.textPrimary, // Dark text
    fontSize: TYPOGRAPHY.fontSizes.lg,
    fontWeight: TYPOGRAPHY.fontWeights.medium, // Medium weight for Material UI
    letterSpacing: 0.5, // Add letter spacing
  },
});

// Input styles (Material UI inspired - Light theme)
export const inputStyles = StyleSheet.create({
  textInput: {
    backgroundColor: COLORS.card, // White background
    borderColor: COLORS.border, // Light border
    borderRadius: BORDER_RADIUS.sm, // Smaller border radius
    borderWidth: 1,
    color: COLORS.textPrimary, // Dark text
    elevation: 1, // Minimal elevation
    fontSize: TYPOGRAPHY.fontSizes.base,
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    shadowColor: COLORS.shadowLight,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    minHeight: 44, // Minimum touch target size
  },
  textInputFocused: {
    borderColor: COLORS.primary, // Dark grey border when focused
    shadowColor: COLORS.primary,
    shadowOpacity: 0.1, // Subtle shadow
  },
});

// Card styles (Material UI inspired - Light theme)
export const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card, // White card background
    borderRadius: BORDER_RADIUS.lg,
    elevation: 2, // Subtle elevation
    padding: SPACING.lg,
    shadowColor: COLORS.shadow,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  cardHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  cardIcon: {
    fontSize: TYPOGRAPHY.fontSizes.xl,
  },
  cardPrimary: {
    backgroundColor: COLORS.card, // Consistent card background
  },
  cardTitle: {
    color: COLORS.textSecondary, // Medium grey title
    fontSize: TYPOGRAPHY.fontSizes.sm,
    fontWeight: TYPOGRAPHY.fontWeights.medium,
    letterSpacing: 0.5,
    textTransform: 'uppercase', // Uppercase for Material UI feel
  },
  cardTitleWhite: {
    color: COLORS.textPrimary, // Dark text for better contrast
  },
});

// Footer styles
export const footerStyles = StyleSheet.create({
  footer: {
    alignItems: 'center',
    paddingBottom: SPACING['3xl'],
  },
  footerHidden: {
    display: 'none',
  },
});

// Animation styles
export const animationStyles = StyleSheet.create({
  fadeIn: {
    opacity: 0,
  },
  scaleSmall: {
    transform: [{ scale: 0.95 }],
  },
});

// List styles (Material UI inspired - Light theme)
export const listStyles = StyleSheet.create({
  listContainer: {
    backgroundColor: COLORS.card, // White background
    borderRadius: BORDER_RADIUS.lg,
    marginHorizontal: SPACING.md,
    overflow: 'hidden',
    elevation: 2, // Subtle elevation
    shadowColor: COLORS.shadow,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  listItem: {
    alignItems: 'center',
    borderBottomColor: COLORS.border, // Light border
    borderBottomWidth: 0.5,
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
  },
  listItemContent: {
    flex: 1,
    justifyContent: 'center',
  },
  listItemName: {
    color: COLORS.textPrimary, // Dark text
    fontSize: TYPOGRAPHY.fontSizes.base,
    fontWeight: TYPOGRAPHY.fontWeights.medium,
  },
  statusContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 80,
  },
  statusDot: {
    borderRadius: 4,
    height: 8,
    marginLeft: SPACING.lg,
    width: 8,
  },
});

// OTP specific styles (Material UI inspired - Light theme)
export const otpStyles = StyleSheet.create({
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center', // Center the boxes
    alignItems: 'center',
    marginBottom: SPACING['2xl'],
    paddingHorizontal: SPACING.sm, // Minimal padding
    flexWrap: 'nowrap', // Prevent wrapping
  },
  otpInput: {
    backgroundColor: COLORS.card, // White background
    borderColor: COLORS.border, // Light border
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    color: COLORS.textPrimary, // Dark text
    elevation: 2, // Subtle elevation
    fontSize: TYPOGRAPHY.fontSizes['2xl'], // Reduced font size
    fontWeight: TYPOGRAPHY.fontWeights.bold,
    height: 50, // Reduced height
    shadowColor: COLORS.shadowLight,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    textAlign: 'center',
    width: 42, // Reduced width to fit 6 boxes comfortably
    marginHorizontal: 3, // Small margin between boxes
  },
  otpInputFilled: {
    borderColor: COLORS.primary, // Dark grey border when filled
    borderWidth: 2,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.1, // Subtle shadow
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: SPACING['2xl'],
  },
  resendLink: {
    color: COLORS.primary, // Dark grey link
    fontSize: TYPOGRAPHY.fontSizes.base,
    fontWeight: TYPOGRAPHY.fontWeights.medium,
  },
  resendText: {
    color: COLORS.textSecondary, // Medium grey text
    fontSize: TYPOGRAPHY.fontSizes.base,
  },
});