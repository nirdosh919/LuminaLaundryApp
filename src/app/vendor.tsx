import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { fetchVendorOrders, type VendorOrder } from "@/lib/laundry-api";
import { useAppTheme } from "@/providers/app-theme-provider";
import { RoleLogoutButton } from "@/components/role-logout-button";
import { LuminaLogo } from "@/components/brand-ui";

const sections = [
  { route: "/vendor-bookings", icon: "▣", title: "Bookings", copy: "Review new orders and assign handoffs." },
  { route: "/vendor-services", icon: "◇", title: "Services", copy: "Manage your catalogue and pricing." },
  { route: "/vendor-schedule", icon: "◷", title: "Schedule", copy: "Set opening and preparation hours." },
  { route: "/vendor-areas", icon: "⌖", title: "Service areas", copy: "Choose pickup and delivery zones." },
  { route: "/vendor-pos", icon: "₹", title: "Point of sale", copy: "Record counter orders and receipts." },
] as const;

export default function VendorDashboardScreen() {
  const { colors } = useAppTheme();
  const [orders, setOrders] = useState<VendorOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const load = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError("");
    try { setOrders(await fetchVendorOrders()); } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not load the partner dashboard."); } finally { setLoading(false); setRefreshing(false); }
  }, []);
  useEffect(() => { void Promise.resolve().then(() => load()); }, [load]);
  const counts = useMemo(() => ({ pending: orders.filter((order) => order.status === "pending").length, active: orders.filter((order) => !["delivered", "cancelled"].includes(order.status)).length, revenue: orders.reduce((total, order) => total + order.amount, 0) }), [orders]);
  const s = styles(colors);
  return <SafeAreaView style={s.safe} edges={["top"]}><ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={colors.primary} />}>
    <View style={s.header}><LuminaLogo height={32} /><RoleLogoutButton /></View>
    <Text style={s.eyebrow}>GOOD TO SEE YOU</Text><Text style={s.title}>Run your shop with clarity.</Text><Text style={s.subtitle}>Everything your laundry team needs for today, gathered in one calm workspace.</Text>
    {loading ? <View style={s.loader}><ActivityIndicator color={colors.primary} /><Text style={s.body}>Loading your shop overview…</Text></View> : <>
      {!!error && <View style={s.error}><Text style={s.errorText}>{error}</Text><Pressable onPress={() => void load()}><Text style={s.retry}>Retry</Text></Pressable></View>}
      <View style={s.stats}>{[{ label: "Total bookings", value: orders.length }, { label: "Needs attention", value: counts.pending }, { label: "Active orders", value: counts.active }, { label: "Order value", value: `₹${counts.revenue.toLocaleString("en-IN")}` }].map((item) => <View key={item.label} style={s.stat}><Text style={s.statValue}>{item.value}</Text><Text style={s.statLabel}>{item.label}</Text></View>)}</View>
    </>}
    <View style={s.sectionHeader}><Text style={s.sectionTitle}>Your operations</Text><Text style={s.sectionCopy}>Jump into the part of your shop you want to manage.</Text></View>
    <View style={s.grid}>{sections.map((section) => <Pressable key={section.route} onPress={() => router.push(section.route as never)} style={({ pressed }) => [s.action, pressed && s.pressed]}><View style={s.actionIcon}><Text style={s.actionIconText}>{section.icon}</Text></View><Text style={s.actionTitle}>{section.title}</Text><Text style={s.actionCopy}>{section.copy}</Text><Text style={s.actionLink}>Open section →</Text></Pressable>)}</View>
    <Pressable onPress={() => router.push("/vendor-bookings")} style={s.primary}><Text style={s.primaryText}>Open booking desk →</Text></Pressable>
    <Text style={s.footer}>PARTNER PORTAL · LIVE BOOKING DATA WITH LOCAL OPERATIONS PREVIEW</Text>
  </ScrollView></SafeAreaView>;
}

function styles(colors: ReturnType<typeof useAppTheme>["colors"]) { return StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.background }, content: { padding: 20, paddingBottom: 42 }, header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 8 }, brand: { color: colors.text, fontSize: 23, fontWeight: "900", letterSpacing: 4 }, brandSub: { color: colors.textSecondary, fontSize: 8, fontWeight: "900", letterSpacing: 1.7, marginTop: 4 }, exit: { borderWidth: 1, borderColor: colors.border, borderRadius: 11, paddingVertical: 9, paddingHorizontal: 14 }, exitText: { color: colors.primary, fontSize: 11, fontWeight: "900" }, eyebrow: { color: colors.primary, fontSize: 10, fontWeight: "900", letterSpacing: 1.8, marginTop: 30 }, title: { color: colors.text, fontSize: 32, lineHeight: 39, fontWeight: "900", marginTop: 8, maxWidth: 350 }, subtitle: { color: colors.textSecondary, fontSize: 13, lineHeight: 20, marginTop: 8, maxWidth: 350 }, loader: { alignItems: "center", paddingVertical: 34, gap: 9 }, body: { color: colors.textSecondary, fontSize: 12 }, error: { backgroundColor: colors.dangerBackground, borderRadius: 14, padding: 13, marginTop: 18, flexDirection: "row", gap: 10, alignItems: "center" }, errorText: { color: colors.danger, flex: 1, fontSize: 11, lineHeight: 16 }, retry: { color: colors.danger, fontSize: 11, fontWeight: "900" }, stats: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 22 }, stat: { backgroundColor: colors.accentSoft, borderRadius: 16, padding: 14, minWidth: "47%", flexGrow: 1 }, statValue: { color: colors.primary, fontSize: 22, fontWeight: "900" }, statLabel: { color: colors.textSecondary, fontSize: 10, marginTop: 5 }, sectionHeader: { marginTop: 31, marginBottom: 13 }, sectionTitle: { color: colors.text, fontSize: 22, fontWeight: "900" }, sectionCopy: { color: colors.textSecondary, fontSize: 12, marginTop: 4 }, grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 }, action: { backgroundColor: colors.backgroundElement, borderColor: colors.border, borderWidth: 1, borderRadius: 17, padding: 14, width: "48%", minHeight: 153 }, pressed: { opacity: 0.78, transform: [{ scale: 0.98 }] }, actionIcon: { width: 34, height: 34, borderRadius: 11, backgroundColor: colors.accentSoft, justifyContent: "center", alignItems: "center" }, actionIconText: { color: colors.primary, fontSize: 20, fontWeight: "900" }, actionTitle: { color: colors.text, fontSize: 14, fontWeight: "900", marginTop: 11 }, actionCopy: { color: colors.textSecondary, fontSize: 10, lineHeight: 15, marginTop: 4 }, actionLink: { color: colors.primary, fontSize: 10, fontWeight: "900", marginTop: "auto" }, primary: { backgroundColor: colors.primaryStrong, borderRadius: 14, minHeight: 52, justifyContent: "center", alignItems: "center", marginTop: 15 }, primaryText: { color: colors.onPrimary, fontSize: 13, fontWeight: "900" }, footer: { color: colors.textSecondary, textAlign: "center", fontSize: 9, letterSpacing: 1, fontWeight: "800", marginTop: 25 } }); }
