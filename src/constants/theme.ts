/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export type ThemeMode = 'light' | 'dark' | 'system';
export type ThemeAccent = 'brand' | 'aqua' | 'blue' | 'purple' | 'green';
export type ThemeFontSize = 'small' | 'standard' | 'large';

export type ThemePreferences = {
  mode: ThemeMode;
  accent: ThemeAccent;
  fontSize: ThemeFontSize;
  reduceMotion: boolean;
};

export const BrandColors = {
  navy: '#1E2B24',
  aqua: '#3E755F',
  softAqua: '#E9F1ED',
  lightBackground: '#F7F5F0',
  surface: '#FFFFFF',
  text: '#1E2B24',
  secondaryText: '#6F7D75',
  border: '#DDE5DF',
  danger: '#C0392B',
  forest: '#2B5445',
  green: '#3E755F',
  mint: '#EDCB88',
  gold: '#EDCB88',
  ink: '#1E2B24',
  muted: '#6F7D75',
  cream: '#F7F5F0',
} as const;

const accentColors: Record<
  ThemeAccent,
  {
    primary: string;
    strong: string;
    soft: string;
    darkPrimary: string;
    darkStrong: string;
    darkSoft: string;
    darkOnPrimary: string;
    highlight: string;
  }
> = {
  brand: {
    primary: '#3E755F', strong: '#2B5445', soft: '#E9F1ED',
    darkPrimary: '#A9C79A', darkStrong: '#D8E5C9', darkSoft: '#21382A',
    darkOnPrimary: '#0F2015', highlight: '#EDCB88',
  },
  aqua: {
    primary: '#168C91', strong: '#106A70', soft: '#E5F6F4',
    darkPrimary: '#6DD8DA', darkStrong: '#B7F1F1', darkSoft: '#17353B',
    darkOnPrimary: '#123131', highlight: '#E7BC58',
  },
  blue: {
    primary: '#2563EB', strong: '#1D4ED8', soft: '#E8F0FE',
    darkPrimary: '#8CB1FF', darkStrong: '#D0DEFF', darkSoft: '#172B48',
    darkOnPrimary: '#14203B', highlight: '#E7BC58',
  },
  purple: {
    primary: '#7C3AED', strong: '#5B21B6', soft: '#F2EBFF',
    darkPrimary: '#B99AFF', darkStrong: '#E2D6FF', darkSoft: '#30204E',
    darkOnPrimary: '#23173C', highlight: '#E7BC58',
  },
  green: {
    primary: '#22824A', strong: '#1A6337', soft: '#E8F5EC',
    darkPrimary: '#86D69F', darkStrong: '#C1ECCD', darkSoft: '#1C3429',
    darkOnPrimary: '#14241A', highlight: '#E7BC58',
  },
};

export type AppThemeColors = {
  text: string;
  background: string;
  backgroundElement: string;
  backgroundSelected: string;
  textSecondary: string;
  border: string;
  input: string;
  modal: string;
  navigation: string;
  primary: string;
  primaryStrong: string;
  onPrimary: string;
  accentSoft: string;
  gold: string;
  danger: string;
  dangerBackground: string;
  success: string;
  successBackground: string;
  warning: string;
  warningBackground: string;
};

export function getAppThemeColors(
  mode: 'light' | 'dark',
  accent: ThemeAccent,
): AppThemeColors {
  const accentColor = accentColors[accent];

  if (mode === 'dark') {
    return {
      text: '#F2F4EC',
      background: '#111B15',
      backgroundElement: '#19271E',
      backgroundSelected: accentColor.darkSoft,
      textSecondary: '#B9C5B9',
      border: '#324438',
      input: '#15231A',
      modal: '#1D2D22',
      navigation: '#111B15',
      primary: accentColor.darkPrimary,
      primaryStrong: accentColor.darkStrong,
      onPrimary: accentColor.darkOnPrimary,
      accentSoft: accentColor.darkSoft,
      gold: '#F2CC6D',
      danger: '#FF9B91',
      dangerBackground: '#412827',
      success: '#8AD5A5',
      successBackground: '#203D2A',
      warning: '#F2CC6D',
      warningBackground: '#3B311E',
    };
  }

  return {
    text: '#1E2B24',
    background: '#F7F5F0',
    backgroundElement: '#FFFFFF',
    backgroundSelected: accentColor.soft,
    textSecondary: '#6F7D75',
    border: '#DDE5DF',
    input: '#FFFFFF',
    modal: '#FFFFFF',
    navigation: '#F7F5F0',
    primary: accentColor.primary,
    primaryStrong: accentColor.strong,
    onPrimary: '#FFFFFF',
    accentSoft: accentColor.soft,
    gold: accentColor.highlight,
    danger: '#C0392B',
    dangerBackground: '#F7E3DF',
    success: '#3E755F',
    successBackground: '#E9F1ED',
    warning: '#8A5B16',
    warningBackground: '#FBF1E2',
  };
}

export const Colors: Record<'light' | 'dark', AppThemeColors> = {
  light: getAppThemeColors('light', 'brand'),
  dark: getAppThemeColors('dark', 'brand'),
};

export const DEFAULT_THEME_PREFERENCES: ThemePreferences = {
  mode: 'light',
  accent: 'brand',
  fontSize: 'standard',
  reduceMotion: false,
};

export const FONT_SIZE_SCALE: Record<ThemeFontSize, number> = {
  small: 0.9,
  standard: 1,
  large: 1.15,
};

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
