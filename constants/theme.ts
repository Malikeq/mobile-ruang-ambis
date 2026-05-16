// Design tokens for AI Lolos PTN mobile app
export const Colors = {
  // Primary — deep blue
  primary: '#1A56DB',
  primaryLight: '#3B82F6',
  primaryDark: '#1E3A8A',

  // Secondary — golden yellow
  secondary: '#F59E0B',
  secondaryLight: '#FCD34D',
  secondaryDark: '#B45309',

  // Neutrals
  background: '#0A0F1E',       // Very dark navy
  surface: '#111827',          // Dark card surface
  surfaceElevated: '#1F2937',  // Elevated cards
  border: '#1F2937',
  borderLight: '#374151',

  // Text
  textPrimary: '#F9FAFB',
  textSecondary: '#9CA3AF',
  textMuted: '#6B7280',

  // Accent
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',

  // Gradients (used as array pairs)
  gradientBlue: ['#1A56DB', '#1E3A8A'] as const,
  gradientGold: ['#F59E0B', '#B45309'] as const,
  gradientDark: ['#0A0F1E', '#111827'] as const,
  gradientHero: ['#0A0F1E', '#0D1B3E', '#1A56DB22'] as const,
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const FontSize = {
  xs: 11,
  sm: 13,
  base: 15,
  md: 17,
  lg: 20,
  xl: 24,
  xxl: 30,
  hero: 38,
};
