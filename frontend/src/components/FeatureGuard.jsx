import { useFeature } from '@/hooks/useFeature';

/**
 * FeatureGuard Component
 * 
 * A wrapper component that conditionally renders children based on feature flag status.
 * Uses the useFeature hook to check if a feature is enabled for a specific team.
 * 
 * @param {string} feature - Feature name (e.g., 'goalInvolvementEnabled')
 * @param {string|null} teamId - Team ID to check age group override (optional)
 * @param {React.ReactNode} children - Content to render if feature is enabled
 * @param {React.ReactNode} fallback - Content to render if feature is disabled (default: null)
 * 
 * @example
 * <FeatureGuard feature="goalInvolvementEnabled" teamId={game.teamId}>
 *   <GoalInvolvementSection {...props} />
 * </FeatureGuard>
 */
export const FeatureGuard = ({ feature, teamId, children, fallback = null }) => {
  const isEnabled = useFeature(feature, teamId);

  if (!isEnabled) return fallback;

  return <>{children}</>;
};

