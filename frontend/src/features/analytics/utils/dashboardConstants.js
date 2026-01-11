/**
 * Dashboard Color System - Centralized for easy theme changes
 */
export const DASHBOARD_COLORS = {
  primary: 'green-400', // Main accent color for icons, borders, highlights
  primaryGradient: 'from-green-500 to-emerald-500', // Gradient for profile pictures
  secondary: 'cyan-400', // Secondary accent for hover effects, links
  secondaryHover: 'cyan-500', // Hover state for secondary elements
  text: {
    primary: 'text-white',
    secondary: 'text-slate-400',
    accent: 'text-green-400',
  },
  background: {
    card: 'bg-slate-800/70',
    hover: 'hover:bg-slate-700/30',
    border: 'border-slate-700',
  },
  effects: {
    hoverShadow: 'hover:shadow-cyan-500/30',
    hoverBorder: 'hover:border-cyan-500',
    transition: 'transition-all duration-300',
  },
};

/**
 * Drill category colors for training schedule
 */
export const DRILL_CATEGORY_COLORS = {
  Passing: 'bg-blue-500',
  Shooting: 'bg-red-500',
  Dribbling: 'bg-yellow-500',
  Defense: 'bg-green-500',
  Goalkeeping: 'bg-purple-500',
  'Warm-up': 'bg-orange-500',
  Physical: 'bg-pink-500',
  Tactics: 'bg-cyan-500',
  Conditioning: 'bg-indigo-500',
  'Small Sided Game': 'bg-emerald-500',
};

/**
 * Dashboard layout constants
 */
export const DASHBOARD_LAYOUT = {
  maxWidth: 'max-w-7xl',
  padding: 'p-6 md:p-8',
  background: 'bg-slate-900',
  minHeight: 'min-h-screen',
  textColor: 'text-slate-100',
  fontFamily: 'font-sans',
};

/**
 * Card styling constants
 */
export const CARD_STYLES = {
  base: `${DASHBOARD_COLORS.background.card} ${DASHBOARD_COLORS.background.border} shadow-xl ${DASHBOARD_COLORS.effects.hoverShadow} ${DASHBOARD_COLORS.effects.hoverBorder} ${DASHBOARD_COLORS.effects.transition} backdrop-blur-sm`,
  flex: `${DASHBOARD_COLORS.background.card} ${DASHBOARD_COLORS.background.border} shadow-xl ${DASHBOARD_COLORS.effects.hoverShadow} ${DASHBOARD_COLORS.effects.hoverBorder} ${DASHBOARD_COLORS.effects.transition} backdrop-blur-sm flex flex-col`,
};
