import { StyleSheet } from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../constants';

// Common layout styles
export const layoutStyles = StyleSheet.create({
  centerContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  container: {
    backgroundColor: COLORS.headerBackground,
    flex: 1,
  },
  content: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    elevation: 25,
    flex: 1,
    marginTop: -12,
    paddingHorizontal: SPACING['2xl'],
    paddingTop: SPACING['4xl'],
    // Enhanced layered shadow effects
    shadowColor: COLORS.shadow,
    shadowOffset: {
      width: 0,
      height: -12,
    },
    borderWidth: 0.5,
    shadowOpacity: 0.25,
    shadowRadius: 20,
    // Additional shadow layers for depth
    borderColor: 'rgba(203, 213, 225, 0.3)',
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

// Header styles
export const headerStyles = StyleSheet.create({
  header: {
    alignItems: 'center',
    paddingBottom: SPACING['6xl'],
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING['6xl'],
  },
  logoContainer: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  logoIcon: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    height: 24,
    justifyContent: 'center',
    marginRight: SPACING.sm,
    width: 24,
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
  bodyText: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSizes.base,
    lineHeight: TYPOGRAPHY.lineHeights.normal,
  },
  caption: {
    color: COLORS.textMuted,
    fontSize: TYPOGRAPHY.fontSizes.sm,
  },
  footerText: {
    color: COLORS.textMuted,
    fontSize: TYPOGRAPHY.fontSizes.xs,
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSizes.lg,
    lineHeight: TYPOGRAPHY.lineHeights.normal,
    marginBottom: SPACING['3xl'] + SPACING.xs,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSizes['4xl'],
    fontWeight: TYPOGRAPHY.fontWeights.bold,
    marginBottom: SPACING.md,
  },
});

// Button styles
export const buttonStyles = StyleSheet.create({
  primaryButton: {
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.lg,
    elevation: 8,
    paddingVertical: SPACING.lg + 2,
    shadowColor: COLORS.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
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
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    paddingVertical: SPACING.lg + 2,
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
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1.5,
    color: COLORS.textPrimary,
    elevation: 2,
    fontSize: TYPOGRAPHY.fontSizes.lg,
    marginBottom: SPACING['2xl'] + SPACING.xs,
    paddingHorizontal: SPACING.lg + 2,
    paddingVertical: SPACING.lg + 2,
    shadowColor: COLORS.shadowLight,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
    elevation: 4,
    padding: SPACING.lg,
    shadowColor: COLORS.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
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
    backgroundColor: COLORS.headerBackground,
  },
  cardTitle: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSizes.sm,
    fontWeight: TYPOGRAPHY.fontWeights.semibold,
    letterSpacing: 0.5,
  },
  cardTitleWhite: {
    color: COLORS.textWhite,
  },
});

// Footer styles
export const footerStyles = StyleSheet.create({
  footer: {
    alignItems: 'center',
    paddingBottom: SPACING['4xl'],
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
  slideUp: {
    transform: [{ translateY: 50 }],
  },
});

// List styles
export const listStyles = StyleSheet.create({
  listContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    marginHorizontal: SPACING.xl,
    overflow: 'hidden',
  },
  listItem: {
    alignItems: 'center',
    borderBottomColor: COLORS.borderLight,
    borderBottomWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
  },
  listItemContent: {
    flex: 1,
    justifyContent: 'center',
  },
  listItemName: {
    color: COLORS.textPrimary,
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

// OTP specific styles
export const otpStyles = StyleSheet.create({
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING['2xl'] + SPACING.xs,
    paddingHorizontal: SPACING.xl,
  },
  otpInput: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.borderLight,
    borderRadius: BORDER_RADIUS.lg - 3,
    borderWidth: 2,
    color: COLORS.textPrimary,
    elevation: 3,
    fontSize: TYPOGRAPHY.fontSizes['4xl'],
    fontWeight: TYPOGRAPHY.fontWeights.bold,
    height: 60,
    shadowColor: COLORS.shadowLight,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    textAlign: 'center',
    width: 60,
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
  resendLink: {
    color: COLORS.primary,
    fontSize: TYPOGRAPHY.fontSizes.base,
    fontWeight: TYPOGRAPHY.fontWeights.semibold,
  },
  resendText: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSizes.base,
  },
});
