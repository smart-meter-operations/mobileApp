import { StyleSheet, Platform } from 'react-native';
import Constants from 'expo-constants';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../constants';

// Dashboard specific styles
export const dashboardStyles = StyleSheet.create({
  activeTabText: {
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.fontWeights.semibold,
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
    backgroundColor: COLORS.surface,
    borderTopColor: COLORS.borderLight,
    borderTopWidth: 1,
    flexDirection: 'row',
    paddingBottom: Platform.OS === 'android' ? SPACING.lg + 10 : SPACING.sm,
    paddingHorizontal: SPACING.sm,
    paddingTop: SPACING.md,
  },
  cardTouchable: {
    flex: 1,
  },
  container: {
    backgroundColor: COLORS.background,
    flex: 1,
    paddingTop: Platform.OS === 'android' ? Constants.statusBarHeight + 10 : 0,
  },
  content: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.xl,
    paddingVertical: SPACING.lg,
  },
  installationCard: {
    backgroundColor: COLORS.headerBackground,
  },
  newInstallationButton: {
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.lg,
    elevation: 8,
    margin: SPACING.xl,
    paddingVertical: SPACING.lg,
    shadowColor: COLORS.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  newInstallationText: {
    color: COLORS.textWhite,
    fontSize: TYPOGRAPHY.fontSizes.lg,
    fontWeight: TYPOGRAPHY.fontWeights.semibold,
  },
  roleText: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSizes.base,
    marginTop: 2,
  },
  safeArea: {
    flex: 1,
    paddingBottom: 10,
  },
  statCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    elevation: 4,
    flex: 1,
    padding: SPACING.lg,
    shadowColor: COLORS.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  statCount: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSizes.base,
    fontWeight: TYPOGRAPHY.fontWeights.semibold,
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
  },
  statLabel: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSizes.base,
    marginBottom: SPACING.lg,
  },
  statNumber: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSizes['5xl'],
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
    fontWeight: TYPOGRAPHY.fontWeights.semibold,
    letterSpacing: 0.5,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: SPACING.md,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
  },
  statusBadge: {
    backgroundColor: COLORS.borderLight,
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
    backgroundColor: COLORS.surface,
  },
  tabButton: {
    alignItems: 'center',
    flex: 1,
    paddingVertical: SPACING.sm,
  },
  tabIcon: {
    fontSize: TYPOGRAPHY.fontSizes.lg,
    marginBottom: 4,
  },
  tabText: {
    color: COLORS.textMuted,
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
    fontWeight: TYPOGRAPHY.fontWeights.semibold,
    letterSpacing: 0.5,
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
    fontWeight: TYPOGRAPHY.fontWeights.semibold,
  },
});
