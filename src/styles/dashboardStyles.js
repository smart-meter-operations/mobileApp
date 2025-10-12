import { StyleSheet, Platform } from 'react-native';
import Constants from 'expo-constants';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../constants';

// Dashboard specific styles (Material UI inspired - Light theme)
export const dashboardStyles = StyleSheet.create({
  activeTabButton: {
    // Enhanced active state for better visibility on grey background
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.sm,
  },
  activeTabText: {
    color: COLORS.textPrimary, // Using dark grey for better contrast
    fontWeight: TYPOGRAPHY.fontWeights.medium,
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: COLORS.borderLight,
    borderRadius: 24,
    height: 48,
    justifyContent: 'center',
    marginRight: SPACING.md,
    width: 48,
  },
  avatarText: {
    fontSize: TYPOGRAPHY.fontSizes.xl,
  },
  bottomNav: {
    backgroundColor: COLORS.background, // Changed to grey background
    borderTopColor: COLORS.border,
    borderTopWidth: 0.5,
    flexDirection: 'row',
    paddingBottom: Platform.OS === 'android' ? Math.round((SPACING.lg + 10) * 0.25) : Math.round(SPACING.sm * 0.25),
    paddingHorizontal: SPACING.sm,
    paddingTop: Math.round(SPACING.md * 0.25),
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardTouchable: {
    flex: 1,
  },
  container: {
    backgroundColor: COLORS.background, // Light grey background
    flex: 1,
    paddingTop: Platform.OS === 'android' ? Math.round((Constants.statusBarHeight + 10) * 0.8) : 0,
  },
  content: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    backgroundColor: COLORS.headerBackground, // White header
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.xl,
    paddingVertical: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  installationCard: {
    backgroundColor: COLORS.card, // White background
  },
  newInstallationButton: {
    alignItems: 'center',
    backgroundColor: COLORS.primary, // Dark grey background
    borderRadius: BORDER_RADIUS.md, // Material UI border radius
    elevation: 4, // Enhanced elevation
    margin: SPACING.xl,
    paddingVertical: SPACING.lg,
    shadowColor: COLORS.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    minWidth: 140, // Minimum width for better touch targets
  },
  newInstallationText: {
    color: COLORS.textWhite,
    fontSize: TYPOGRAPHY.fontSizes.lg,
    fontWeight: TYPOGRAPHY.fontWeights.medium, // Medium weight for Material UI
    letterSpacing: 0.5, // Add letter spacing
  },
  roleText: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSizes.sm,
    marginTop: 2,
  },
  safeArea: {
    flex: 1,
    paddingBottom: 8,
  },
  statCard: {
    backgroundColor: COLORS.card, // White background
    borderRadius: BORDER_RADIUS.lg,
    elevation: 3,
    flex: 1,
    padding: SPACING.lg,
    shadowColor: COLORS.shadow,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  statCount: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSizes.base,
    fontWeight: TYPOGRAPHY.fontWeights.medium,
  },
  statDetails: {
    gap: SPACING.sm,
  },
  statDot: {
    borderRadius: 4,
    height: 8,
    marginRight: SPACING.sm,
    width: 8,
  },
  statHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  statIcon: {
    fontSize: TYPOGRAPHY.fontSizes.xl,
    color: COLORS.textSecondary,
  },
  statLabel: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSizes.base,
    marginBottom: SPACING.lg,
  },
  statNumber: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSizes['4xl'],
    fontWeight: TYPOGRAPHY.fontWeights.bold,
    marginBottom: 4,
  },
  statRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  statText: {
    color: COLORS.textSecondary,
    flex: 1,
    fontSize: TYPOGRAPHY.fontSizes.sm,
  },
  statTitle: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSizes.sm,
    fontWeight: TYPOGRAPHY.fontWeights.medium,
    letterSpacing: 0.5,
    textTransform: 'uppercase', // Uppercase for Material UI feel
  },
  statsContainer: {
    flexDirection: 'row',
    gap: SPACING.md,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
  },
  statusBadge: {
    backgroundColor: COLORS.card, // White background
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
  },
  statusText: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSizes.sm,
    fontWeight: TYPOGRAPHY.fontWeights.medium,
  },
  surveyCard: {
    backgroundColor: COLORS.card, // White background
  },
  tabButton: {
    alignItems: 'center',
    flex: 1,
    paddingVertical: Math.round(SPACING.sm * 0.25),
    // Added subtle background for better differentiation
    borderRadius: BORDER_RADIUS.sm,
  },
  tabIcon: {
    fontSize: TYPOGRAPHY.fontSizes.lg,
    marginBottom: 1,
    color: COLORS.textSecondary,
  },
  tabText: {
    color: COLORS.textSecondary, // Using medium grey for better contrast
    fontSize: TYPOGRAPHY.fontSizes.xs,
    fontWeight: TYPOGRAPHY.fontWeights.medium,
  },
  tableHeader: {
    backgroundColor: COLORS.background,
    flexDirection: 'row',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
  },
  tableHeaderText: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSizes.sm,
    fontWeight: TYPOGRAPHY.fontWeights.medium,
    letterSpacing: 0.5,
    textTransform: 'uppercase', // Uppercase for Material UI feel
  },
  userDetails: {
    flex: 1,
  },
  userInfo: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  welcomeText: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSizes.lg,
    fontWeight: TYPOGRAPHY.fontWeights.medium,
  },
  syncButtonContainer: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
  },
  syncButton: {
    backgroundColor: COLORS.primary, // Dark grey background
    borderRadius: BORDER_RADIUS.md, // Material UI border radius
    paddingVertical: SPACING.md,
    shadowColor: COLORS.shadow,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3, // Subtle elevation
  },
  // New styles for redesigned dashboard
  sectionTitle: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSizes.xl,
    fontWeight: TYPOGRAPHY.fontWeights.medium,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    letterSpacing: 0.5, // Add letter spacing
  },
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
  },
  metricsContainer: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.sm,
  },
  activitiesContainer: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.xl,
  },
});