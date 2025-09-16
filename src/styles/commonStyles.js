import { StyleSheet } from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../constants';

// Common layout styles
export const layoutStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.headerBackground,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    paddingHorizontal: SPACING['2xl'],
    paddingTop: SPACING['4xl'],
    marginTop: -12,
    // Enhanced layered shadow effects
    shadowColor: COLORS.shadow,
    shadowOffset: {
      width: 0,
      height: -12,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 25,
    // Additional shadow layers for depth
    borderWidth: 0.5,
    borderColor: 'rgba(203, 213, 225, 0.3)',
    borderTopWidth: 0,
  },
  scrollContent: {
    flex: 1,
  },
  formContainer: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  spaceBetween: {
    justifyContent: 'space-between',
  },
});

// Header styles
export const headerStyles = StyleSheet.create({
  header: {
    paddingTop: SPACING['6xl'],
    paddingBottom: SPACING['6xl'],
    paddingHorizontal: SPACING.xl,
    alignItems: 'center',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  logoIconText: {
    color: COLORS.textWhite,
    fontSize: TYPOGRAPHY.fontSizes.base,
    fontWeight: TYPOGRAPHY.fontWeights.bold,
  },
  logoText: {
    color: COLORS.textWhite,
    fontSize: TYPOGRAPHY.fontSizes['3xl'],
    fontWeight: TYPOGRAPHY.fontWeights.semibold,
  },
});

// Typography styles
export const textStyles = StyleSheet.create({
  title: {
    fontSize: TYPOGRAPHY.fontSizes['4xl'],
    fontWeight: TYPOGRAPHY.fontWeights.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.fontSizes.lg,
    color: COLORS.textSecondary,
    lineHeight: TYPOGRAPHY.lineHeights.normal,
    marginBottom: SPACING['3xl'] + SPACING.xs,
  },
  bodyText: {
    fontSize: TYPOGRAPHY.fontSizes.base,
    color: COLORS.textPrimary,
    lineHeight: TYPOGRAPHY.lineHeights.normal,
  },
  caption: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.textMuted,
  },
  footerText: {
    fontSize: TYPOGRAPHY.fontSizes.xs,
    color: COLORS.textMuted,
  },
});

// Button styles
export const buttonStyles = StyleSheet.create({
  primaryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.lg + 2,
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  primaryButtonDisabled: {
    backgroundColor: COLORS.textMuted,
  },
  primaryButtonText: {
    color: COLORS.textWhite,
    fontSize: TYPOGRAPHY.fontSizes.lg,
    fontWeight: TYPOGRAPHY.fontWeights.bold,
  },
  secondaryButton: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.lg + 2,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSizes.lg,
    fontWeight: TYPOGRAPHY.fontWeights.semibold,
  },
});

// Input styles
export const inputStyles = StyleSheet.create({
  textInput: {
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.lg + 2,
    paddingVertical: SPACING.lg + 2,
    fontSize: TYPOGRAPHY.fontSizes.lg,
    backgroundColor: COLORS.surface,
    marginBottom: SPACING['2xl'] + SPACING.xs,
    color: COLORS.textPrimary,
    shadowColor: COLORS.shadowLight,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  textInputFocused: {
    borderColor: COLORS.borderActive,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.2,
  },
});

// Card styles
export const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    shadowColor: COLORS.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardPrimary: {
    backgroundColor: COLORS.headerBackground,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  cardTitle: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    fontWeight: TYPOGRAPHY.fontWeights.semibold,
    color: COLORS.textSecondary,
    letterSpacing: 0.5,
  },
  cardTitleWhite: {
    color: COLORS.textWhite,
  },
  cardIcon: {
    fontSize: TYPOGRAPHY.fontSizes.xl,
  },
});

// Footer styles
export const footerStyles = StyleSheet.create({
  footer: {
    paddingBottom: SPACING['4xl'],
    alignItems: 'center',
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
  slideUp: {
    transform: [{ translateY: 50 }],
  },
  scaleSmall: {
    transform: [{ scale: 0.95 }],
  },
});

// List styles
export const listStyles = StyleSheet.create({
  listContainer: {
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.xl,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  listItemContent: {
    flex: 1,
    justifyContent: 'center',
  },
  listItemName: {
    fontSize: TYPOGRAPHY.fontSizes.base,
    fontWeight: TYPOGRAPHY.fontWeights.medium,
    color: COLORS.textPrimary,
  },
  statusContainer: {
    width: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: SPACING.lg,
  },
});

// OTP specific styles
export const otpStyles = StyleSheet.create({
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING['2xl'] + SPACING.xs,
    paddingHorizontal: SPACING.xl,
  },
  otpInput: {
    width: 60,
    height: 60,
    borderWidth: 2,
    borderColor: COLORS.borderLight,
    borderRadius: BORDER_RADIUS.lg - 3,
    fontSize: TYPOGRAPHY.fontSizes['4xl'],
    fontWeight: TYPOGRAPHY.fontWeights.bold,
    backgroundColor: COLORS.surface,
    color: COLORS.textPrimary,
    textAlign: 'center',
    shadowColor: COLORS.shadowLight,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  otpInputFilled: {
    borderColor: COLORS.primary,
    borderWidth: 2.5,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.25,
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: SPACING['2xl'] + SPACING.xs,
  },
  resendText: {
    fontSize: TYPOGRAPHY.fontSizes.base,
    color: COLORS.textSecondary,
  },
  resendLink: {
    fontSize: TYPOGRAPHY.fontSizes.base,
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.fontWeights.semibold,
  },
});