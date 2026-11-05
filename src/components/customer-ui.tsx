import React from "react";
import { Pressable, StyleSheet, Text, View, ViewStyle } from "react-native";

export const C = {
  ink: "#1E2B24",
  muted: "#6F7D75",
  brand: "#3E755F",
  brandDark: "#2B5445",
  mint: "#E9F1ED",
  bg: "#F7F5F0",
  card: "#FFFFFF",
  border: "#DDE5DF",
  orange: "#EDCB88",
  green: "#3E755F",
  red: "#C0392B",
};

export function Screen({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.screen, style]}>{children}</View>;
}
export function Heading({ title, subtitle }: { title: string; subtitle?: string }) {
  return <View style={styles.heading}>
    <Text style={styles.title}>{title}</Text>
    {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
  </View>;
}
export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}
export function PrimaryButton({ title, onPress, disabled }: { title: string; onPress: () => void; disabled?: boolean }) {
  return <Pressable accessibilityRole="button" onPress={onPress} disabled={disabled}
    style={({ pressed }) => [styles.button, (pressed || disabled) && { opacity: 0.7 }]}>
    <Text style={styles.buttonText}>{title}</Text>
  </Pressable>;
}
export function Pill({ label, active = false }: { label: string; active?: boolean }) {
  return <View style={[styles.pill, active && styles.pillActive]}>
    <Text style={[styles.pillText, active && { color: C.brandDark }]}>{label}</Text>
  </View>;
}
export function EmptyState({ title, body }: { title: string; body: string }) {
  return <Card style={{ alignItems: "center", paddingVertical: 28 }}>
    <Text style={{ fontSize: 30, marginBottom: 10 }}>🧺</Text>
    <Text style={{ fontSize: 16, fontWeight: "800", color: C.ink }}>{title}</Text>
    <Text style={{ color: C.muted, textAlign: "center", marginTop: 6, lineHeight: 20 }}>{body}</Text>
  </Card>;
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg, padding: 18, gap: 16 },
  heading: { gap: 5, marginTop: 4 },
  title: { color: C.ink, fontSize: 25, fontWeight: "800", letterSpacing: -0.5 },
  subtitle: { color: C.muted, fontSize: 14, lineHeight: 20 },
  card: { backgroundColor: C.card, borderRadius: 18, borderWidth: 1, borderColor: C.border, padding: 16, gap: 10 },
  button: { backgroundColor: C.brand, borderRadius: 13, minHeight: 48, alignItems: "center", justifyContent: "center", paddingHorizontal: 18 },
  buttonText: { color: "#FFFFFF", fontWeight: "800", fontSize: 15 },
  pill: { backgroundColor: "#E9F1ED", borderRadius: 20, paddingVertical: 7, paddingHorizontal: 11, alignSelf: "flex-start" },
  pillActive: { backgroundColor: C.mint },
  pillText: { color: C.muted, fontSize: 12, fontWeight: "700" },
});
