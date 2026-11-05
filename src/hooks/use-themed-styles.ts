import { useMemo } from "react";
import {
  type ImageStyle,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import { useAppTheme } from "@/providers/app-theme-provider";

type ThemeableStyle = ImageStyle | TextStyle | ViewStyle;

const LEGACY_COLORS: Record<string, string> = {
  "#0F2D3C": "#214738",
  "#123B50": "#214738",
  "#168C91": "#2F674A",
  "#18313D": "#17241B",
  "#6B7C87": "#4B5B50",
  "#E2E9EE": "#CDD8CE",
  "#E5F6F4": "#E3EEE6",
  "#F7F9FC": "#F7F5F0",
  "#FFFFFF": "#FFFDFA",
};

function themedColor(
  value: string,
  property: string,
  colors: ReturnType<typeof useAppTheme>["colors"],
): string {
  const normalized = value.toUpperCase();
  if (normalized === "#F7F5F0") {
    return property === "backgroundColor" ? colors.background : value;
  }
  if (normalized === "#FFFDFA") {
    return property === "color" ? colors.onPrimary : colors.backgroundElement;
  }
  if (normalized === "#214738" || normalized === "#17241B") {
    if (property === "backgroundColor") return colors.primary;
    if (property === "borderColor") return colors.primaryStrong;
    return colors.text;
  }
  if (normalized === "#2F674A" || normalized === "#52A7A8") {
    return colors.primary;
  }
  if (normalized === "#E3EEE6") {
    if (property === "backgroundColor") return colors.accentSoft;
    if (property === "borderColor") return colors.border;
  }
  if (normalized === "#E0E8E1") return colors.onPrimary;
  if (normalized === "#A9E2DD") return colors.gold;
  if (normalized === "#8A98A2" || normalized === "#899187") {
    return colors.textSecondary;
  }
  if (normalized === "#4B5B50") {
    return property === "backgroundColor"
      ? colors.backgroundElement
      : colors.textSecondary;
  }
  if (normalized === "#CDD8CE") {
    return property === "backgroundColor"
      ? colors.backgroundElement
      : colors.border;
  }
  if (normalized === "#A93226") return colors.danger;
  if (normalized === "#FDEDEC") return colors.dangerBackground;
  const legacyColor = LEGACY_COLORS[normalized];
  if (legacyColor) return themedColor(legacyColor, property, colors);
  return value;
}

function mapStyle(
  style: ThemeableStyle,
  colors: ReturnType<typeof useAppTheme>["colors"],
  fontScale: number,
): ThemeableStyle {
  const mapped: Record<string, unknown> = { ...style };
  for (const [property, value] of Object.entries(mapped)) {
    if (typeof value === "string" && property.toLowerCase().includes("color")) {
      mapped[property] = themedColor(value, property, colors);
    } else if (
      typeof value === "number" &&
      (property === "fontSize" || property === "lineHeight")
    ) {
      mapped[property] = value * fontScale;
    }
  }
  return mapped as ThemeableStyle;
}

export function useThemedStyles<T extends Record<string, ThemeableStyle>>(
  baseStyles: T,
): T {
  const { colors, fontScale } = useAppTheme();
  return useMemo(() => {
    const themed = {} as T;
    for (const key of Object.keys(baseStyles) as (keyof T)[]) {
      themed[key] = mapStyle(baseStyles[key], colors, fontScale) as T[typeof key];
    }
    return themed;
  }, [baseStyles, colors, fontScale]);
}
