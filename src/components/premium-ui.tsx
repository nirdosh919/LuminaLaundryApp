import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Animated, Easing, Pressable, StyleSheet, Text, View, type PressableProps, type PressableStateCallbackType } from "react-native";
import { LuminaLogo } from "@/components/brand-ui";
import { useAppTheme } from "@/providers/app-theme-provider";

export function PremiumBackdrop({ children }: { children: ReactNode }) {
  const { colors, preferences } = useAppTheme();
  const [drift] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (preferences.reduceMotion) return;
    const animation = Animated.loop(Animated.sequence([
      Animated.timing(drift, { toValue: 1, duration: 3600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(drift, { toValue: 0, duration: 3600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));
    animation.start();
    return () => animation.stop();
  }, [drift, preferences.reduceMotion]);

  const translateY = drift.interpolate({ inputRange: [0, 1], outputRange: [0, -12] });
  return (
    <View style={[styles.backdrop, { backgroundColor: colors.background }]}>
      <Animated.View pointerEvents="none" style={[styles.orb, { backgroundColor: colors.accentSoft, transform: [{ translateY }] }]} />
      <View pointerEvents="none" style={[styles.orbSmall, { backgroundColor: colors.gold }]} />
      {children}
    </View>
  );
}

export function Reveal({ children, delay = 0, style }: { children: ReactNode; delay?: number; style?: object }) {
  const { preferences } = useAppTheme();
  const [opacity] = useState(() => new Animated.Value(preferences.reduceMotion ? 1 : 0));
  const [translateY] = useState(() => new Animated.Value(preferences.reduceMotion ? 0 : 18));

  useEffect(() => {
    if (preferences.reduceMotion) return;
    const animation = Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 420, delay, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, delay, damping: 16, stiffness: 100, useNativeDriver: true }),
    ]);
    animation.start();
    return () => animation.stop();
  }, [delay, opacity, preferences.reduceMotion, translateY]);

  return <Animated.View style={[{ opacity, transform: [{ translateY }] }, style]}>{children}</Animated.View>;
}

export function PremiumButton({ children, variant = "primary", style, ...props }: Omit<PressableProps, "children" | "style"> & { children: ReactNode; variant?: "primary" | "secondary"; style?: PressableProps["style"] }) {
  const { colors } = useAppTheme();
  return (
    <Pressable {...props} style={(state) => [
      styles.button,
      variant === "primary" ? { backgroundColor: colors.primaryStrong } : { backgroundColor: colors.backgroundElement, borderColor: colors.primaryStrong, borderWidth: 1 },
      state.pressed && styles.pressed,
      typeof style === "function" ? style(state as PressableStateCallbackType) : style,
    ]}>
      <Text style={[styles.buttonText, { color: variant === "primary" ? colors.onPrimary : colors.primaryStrong }]}>{children}</Text>
    </Pressable>
  );
}

export function PremiumCard({ children, style }: { children: ReactNode; style?: object }) {
  const { colors } = useAppTheme();
  return <View style={[styles.card, { backgroundColor: colors.backgroundElement, borderColor: colors.border }, style]}>{children}</View>;
}

export function PremiumBrand({ partner = "LAUNDRY & CARE" }: { partner?: string }) {
  const { colors } = useAppTheme();
  return (
    <View>
      <LuminaLogo height={42} />
      {partner !== "LAUNDRY & CARE" && (
        <Text style={[styles.partner, { color: colors.textSecondary }]}>{partner}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, overflow: "hidden" },
  orb: { position: "absolute", width: 260, height: 260, borderRadius: 130, top: -120, right: -80, opacity: 0.55 },
  orbSmall: { position: "absolute", width: 90, height: 90, borderRadius: 45, top: 150, left: -50, opacity: 0.16 },
  partner: { fontSize: 8, fontWeight: "800", letterSpacing: 1.6, marginTop: 3 },
  card: { borderRadius: 24, borderWidth: 1, padding: 19, shadowColor: "#2B5445", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.08, shadowRadius: 20, elevation: 3 },
  button: { minHeight: 54, borderRadius: 15, alignItems: "center", justifyContent: "center", paddingHorizontal: 16, shadowColor: "#2B5445", shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.14, shadowRadius: 10, elevation: 3 },
  buttonText: { fontSize: 13, fontWeight: "900", letterSpacing: 0.2 },
  pressed: { transform: [{ scale: 0.975 }], opacity: 0.9 },
});
