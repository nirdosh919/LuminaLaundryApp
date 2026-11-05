import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useColorScheme } from "react-native";
import {
  DEFAULT_THEME_PREFERENCES,
  FONT_SIZE_SCALE,
  getAppThemeColors,
  type AppThemeColors,
  type ThemePreferences,
} from "@/constants/theme";

const THEME_STORAGE_KEY = "lumina_theme_preferences";

type AppThemeContextValue = {
  colors: AppThemeColors;
  preferences: ThemePreferences;
  effectiveMode: "light" | "dark";
  fontScale: number;
  isReady: boolean;
  updatePreferences: (next: ThemePreferences) => Promise<void>;
};

const AppThemeContext = createContext<AppThemeContextValue | null>(null);

export function AppThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const systemMode = useColorScheme();
  const [preferences, setPreferences] =
    useState<ThemePreferences>(DEFAULT_THEME_PREFERENCES);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let active = true;

    const loadPreferences = async () => {
      try {
        const stored = await AsyncStorage.getItem(THEME_STORAGE_KEY);

        if (stored) {
          const parsed: unknown = JSON.parse(stored);

          if (
            parsed !== null &&
            typeof parsed === "object" &&
            "mode" in parsed &&
            "accent" in parsed &&
            "fontSize" in parsed &&
            "reduceMotion" in parsed
          ) {
            const value = parsed as ThemePreferences;

            if (active) {
              setPreferences({
                ...DEFAULT_THEME_PREFERENCES,
                reduceMotion: value.reduceMotion === true,
              });
            }
          }
        }
      } catch {
        // Retain defaults if saved settings are unavailable or invalid.
      } finally {
        if (active) setIsReady(true);
      }
    };

    void loadPreferences();

    return () => {
      active = false;
    };
  }, []);

  const updatePreferences = useCallback(
    async (next: ThemePreferences) => {
      const brandPreferences: ThemePreferences = {
        ...DEFAULT_THEME_PREFERENCES,
        reduceMotion: next.reduceMotion,
      };
      await AsyncStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(brandPreferences));
      setPreferences(brandPreferences);
    },
    [],
  );

  const effectiveMode: "light" | "dark" =
    preferences.mode === "system"
      ? systemMode === "dark"
        ? "dark"
        : "light"
      : preferences.mode;

  const value = useMemo<AppThemeContextValue>(
    () => ({
      colors: getAppThemeColors(effectiveMode, preferences.accent),
      preferences,
      effectiveMode,
      fontScale: FONT_SIZE_SCALE[preferences.fontSize],
      isReady,
      updatePreferences,
    }),
    [effectiveMode, preferences, isReady, updatePreferences],
  );

  return (
    <AppThemeContext.Provider value={value}>
      {children}
    </AppThemeContext.Provider>
  );
}

export function useAppTheme(): AppThemeContextValue {
  const context = useContext(AppThemeContext);

  if (!context) {
    throw new Error("useAppTheme must be used within AppThemeProvider.");
  }

  return context;
}
