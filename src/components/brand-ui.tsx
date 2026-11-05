import React, { type ReactNode } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type PressableProps,
  type PressableStateCallbackType,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { useAppTheme } from "@/providers/app-theme-provider";

export function LuminaLogo({ height = 36 }: { height?: number }) {
  return (
    <Image
      accessibilityLabel="Lumina Laundry"
      accessible
      resizeMode="contain"
      source={require("../../assets/images/lumina-logo.png")}
      style={{ width: height * 4.845, height }}
    />
  );
}

export function BrandMark({ compact = false }: { compact?: boolean }) {
  if (!compact) return <LuminaLogo />;

  return (
    <Image
      accessibilityLabel="Lumina Laundry"
      accessible
      resizeMode="contain"
      source={require("../../assets/images/lumina-mark.png")}
      style={{ width: 42, height: 42 }}
    />
  );
}

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  right,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  right?: ReactNode;
}) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.header}>
      <View style={styles.headerCopy}>
        {eyebrow ? <Text style={[styles.eyebrow, { color: colors.primary }]}>{eyebrow}</Text> : null}
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        {subtitle ? <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  );
}

export function Surface({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const { colors } = useAppTheme();
  return <View style={[styles.surface, { backgroundColor: colors.backgroundElement, borderColor: colors.border }, style]}>{children}</View>;
}

export function PrimaryButton({ children, style, ...props }: PressableProps) {
  const { colors } = useAppTheme();
  return (
    <Pressable {...props} style={(state: PressableStateCallbackType) => [styles.primaryButton, { backgroundColor: colors.primary }, typeof style === "function" ? style(state) : style]}>
      {typeof children === "string" ? <Text style={[styles.primaryButtonText, { color: colors.onPrimary }]}>{children}</Text> : children}
    </Pressable>
  );
}

export function StatusPill({ status }: { status: string }) {
  const { colors } = useAppTheme();
  const isDone = ["Delivered", "Completed"].includes(status);
  const isWarning = ["In Progress", "Cleaning in Progress", "Ready for Delivery"].includes(status);
  return (
    <View style={[styles.pill, { backgroundColor: isDone ? colors.successBackground : isWarning ? colors.warningBackground : colors.accentSoft }]}>
      <View style={[styles.pillDot, { backgroundColor: isDone ? colors.success : isWarning ? colors.warning : colors.primary }]} />
      <Text style={[styles.pillText, { color: isDone ? colors.success : isWarning ? colors.warning : colors.primary }]}>{status}</Text>
    </View>
  );
}

export function LoadingState({ label = "Loading your Lumina experience…" }: { label?: string }) {
  const { colors } = useAppTheme();
  return <View style={styles.loading}><ActivityIndicator color={colors.primary} /><Text style={[styles.loadingText, { color: colors.textSecondary }]}>{label}</Text></View>;
}

export function HorizontalChips({ items, selected, onSelect }: { items: string[]; selected: string; onSelect: (item: string) => void }) {
  const { colors } = useAppTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
      {items.map((item) => <Pressable key={item} onPress={() => onSelect(item)} style={[styles.chip, { borderColor: colors.border, backgroundColor: item === selected ? colors.primary : colors.backgroundElement }]}><Text style={[styles.chipText, { color: item === selected ? colors.onPrimary : colors.textSecondary }]}>{item}</Text></Pressable>)}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 22 },
  headerCopy: { flex: 1 },
  eyebrow: { color: "#3E755F", fontSize: 9, fontWeight: "900", letterSpacing: 1.8, marginBottom: 7 },
  title: { color: "#1E2B24", fontSize: 30, lineHeight: 36, fontWeight: "800", letterSpacing: -0.6 },
  subtitle: { color: "#6F7D75", fontSize: 12, lineHeight: 19, marginTop: 8, maxWidth: 310 },
  surface: { borderWidth: 1, borderRadius: 20, padding: 16, shadowColor: "#2B5445", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.06, shadowRadius: 15, elevation: 2 },
  primaryButton: { minHeight: 52, borderRadius: 14, alignItems: "center", justifyContent: "center", paddingHorizontal: 18, shadowColor: "#2B5445", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.14, shadowRadius: 8, elevation: 3 },
  primaryButtonText: { fontSize: 13, fontWeight: "800" },
  pill: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", borderRadius: 99, paddingHorizontal: 10, paddingVertical: 6, gap: 6 },
  pillDot: { width: 6, height: 6, borderRadius: 3 },
  pillText: { fontSize: 10, fontWeight: "800" },
  loading: { alignItems: "center", justifyContent: "center", paddingVertical: 56, gap: 12 },
  loadingText: { fontSize: 12 },
  chips: { gap: 8, paddingBottom: 4 },
  chip: { borderWidth: 1, borderRadius: 99, paddingHorizontal: 14, paddingVertical: 9 },
  chipText: { fontSize: 11, fontWeight: "800" },
});
