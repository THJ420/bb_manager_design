/**
 * BB Manager Enterprise Mobile Design Tokens
 * Stripe Dashboard / Material 3 Dark inspired palette
 */
export const Colors = {
  // Surfaces
  background: '#121212',
  surface: '#1E1E1E',
  surfaceElevated: '#262626',
  surfaceBorder: '#333333',
  surfaceHighlight: '#2A2A2A',

  // Primary / Brand Accents (Indigo & Slate)
  primary: '#6366F1',
  primaryHover: '#4F46E5',
  primaryMuted: 'rgba(99, 102, 241, 0.15)',
  slate: '#64748B',
  slateDark: '#334155',

  // Semantic Status Colors
  success: '#10B981',       // Emerald green (Ready / In Stock)
  successMuted: 'rgba(16, 185, 129, 0.15)',
  warning: '#F59E0B',       // Amber (Preparing / Active)
  warningMuted: 'rgba(245, 158, 11, 0.15)',
  info: '#38BDF8',          // Sky blue (New order)
  infoMuted: 'rgba(56, 189, 248, 0.15)',
  error: '#EF4444',         // Soft crimson (Out of Stock / Alerts)
  errorMuted: 'rgba(239, 68, 68, 0.15)',

  // Typography
  textPrimary: '#FFFFFF',
  textSecondary: '#A1A1AA',
  textMuted: '#71717A',
  textInverse: '#121212',

  // Utility
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
} as const;

export const Radius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  full: 9999,
} as const;
