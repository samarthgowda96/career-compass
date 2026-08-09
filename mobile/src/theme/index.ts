import { useColorScheme } from 'react-native';

/**
 * Design tokens with automatic light/dark support.
 *
 * Usage: `const { colors } = useTheme();` — components never hardcode colors.
 */

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  primary: string;
  primarySoft: string;
  onPrimary: string;
  accent: string;
  accentSoft: string;
  success: string;
  successSoft: string;
  warning: string;
  warningSoft: string;
  danger: string;
  gold: string;
}

const light: ThemeColors = {
  background: '#F7F7FB',
  surface: '#FFFFFF',
  surfaceAlt: '#F1F1F8',
  border: '#E4E4EF',
  text: '#17172B',
  textSecondary: '#4A4A63',
  textMuted: '#8A8AA3',
  primary: '#4F46E5',
  primarySoft: '#EEEDFC',
  onPrimary: '#FFFFFF',
  accent: '#F59E0B',
  accentSoft: '#FEF3DE',
  success: '#059669',
  successSoft: '#E3F5EE',
  warning: '#B45309',
  warningSoft: '#FDF0DC',
  danger: '#DC2626',
  gold: '#D97706',
};

const dark: ThemeColors = {
  background: '#0F0F1A',
  surface: '#1A1A2B',
  surfaceAlt: '#242438',
  border: '#31314A',
  text: '#F2F2FA',
  textSecondary: '#C0C0D6',
  textMuted: '#84849E',
  primary: '#8B85F4',
  primarySoft: '#2A2850',
  onPrimary: '#101021',
  accent: '#FBBF24',
  accentSoft: '#3A2F14',
  success: '#34D399',
  successSoft: '#12352A',
  warning: '#FBBF24',
  warningSoft: '#3A2F14',
  danger: '#F87171',
  gold: '#FBBF24',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  sm: 10,
  md: 14,
  lg: 20,
  pill: 999,
} as const;

export const typography = {
  title: { fontSize: 30, fontWeight: '800' as const, letterSpacing: -0.5 },
  heading: { fontSize: 22, fontWeight: '700' as const },
  subheading: { fontSize: 17, fontWeight: '600' as const },
  body: { fontSize: 16, fontWeight: '400' as const, lineHeight: 23 },
  caption: { fontSize: 13, fontWeight: '400' as const },
  button: { fontSize: 17, fontWeight: '700' as const },
} as const;

export interface Theme {
  colors: ThemeColors;
  isDark: boolean;
}

export function useTheme(): Theme {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  return { colors: isDark ? dark : light, isDark };
}
