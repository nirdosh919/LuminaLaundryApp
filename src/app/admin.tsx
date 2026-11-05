import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Pressable, StatusBar, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LuminaLogo, StatusPill } from "@/components/brand-ui";
import { BrandColors } from "@/constants/theme";
import { useAppTheme } from "@/providers/app-theme-provider";
import { fetchAdminDashboard, fetchAdminOrders, updateAdminOrderStatus } from "@/lib/laundry-api";

const STATUSES = ["Pending", "Confirmed", "Picked Up", "In Progress", "Ready", "Out for Delivery", "Delivered", "Cancelled"] as const;
type OrderStatus = (typeof STATUSES)[number];
type Filter = "All" | OrderStatus;
type Order = { id: string; service?: string; status?: string; customerName?: string; phone?: string; address?: string; pickup?: string; date?: string; amount?: string; [key: string]: unknown };
const FILTERS: Filter[] = ["All", ...STATUSES];
const STATUS_INDEX: Record<OrderStatus, number> = { Pending: 0, Confirmed: 1, "Picked Up": 2, "In Progress": 3, Ready: 4, "Out for Delivery": 5, Delivered: 6, Cancelled: 7 };
const STATUS_TO_API: Record<OrderStatus, string> = { Pending: "pending", Confirmed: "confirmed", "Picked Up": "picked_up", "In Progress": "in_progress", Ready: "ready", "Out for Delivery": "out_for_delivery", Delivered: "delivered", Cancelled: "cancelled" };
const API_TO_STATUS: Record<string, OrderStatus> = { pending: "Pending", confirmed: "Confirmed", picked_up: "Picked Up", in_progress: "In Progress", ready: "Ready", out_for_delivery: "Out for Delivery", delivered: "Delivered", cancelled: "Cancelled" };

function isOrderStatus(value: unknown): value is OrderStatus { return typeof value === "string" && (STATUSES as readonly string[]).includes(value); }
function canMoveStatus(from: OrderStatus, to: OrderStatus) { return from === to || (from !== "Delivered" && from !== "Cancelled" && (to === "Cancelled" || STATUS_INDEX[to] >= STATUS_INDEX[from])); }

export default function AdminScreen() {
  const { colors, effectiveMode } = useAppTheme();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<Filter>("All");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [hasAdminSession, setHasAdminSession] = useState<boolean | null>(null);
  const [serverStats, setServerStats] = useState<import("@/lib/laundry-api").AdminDashboardStats | null>(null);

  const loadOrders = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError("");
    try {
      const rawSession = await AsyncStorage.getItem("lumina_mobile_session");
      const session: unknown = rawSession ? JSON.parse(rawSession) : null;
      const role = session && typeof session === "object" ? (session as { role?: unknown }).role : null;
      setHasAdminSession(role === "admin");
      const [remoteOrders, dashboard] = await Promise.all([fetchAdminOrders(), fetchAdminDashboard()]);
      setServerStats(dashboard);
      setOrders(remoteOrders.map((item) => ({ id: String(item.id), service: item.service, status: API_TO_STATUS[item.status] ?? item.status_label, customerName: item.customer_name ?? undefined, phone: item.phone ?? undefined, pickup: item.pickup ?? undefined, address: item.address ?? undefined, amount: String(item.amount) })));
    } catch (cause) {
      console.error("Admin orders load failed:", cause);
      setError("Saved orders could not be read. Try again.");
    } finally { setLoading(false); setRefreshing(false); }
  }, []);

  useFocusEffect(useCallback(() => { void loadOrders(); }, [loadOrders]));

  const updateStatus = useCallback(async (order: Order, nextStatus: OrderStatus) => {
    const currentStatus = isOrderStatus(order.status) ? order.status : "Confirmed";
    if (!canMoveStatus(currentStatus, nextStatus)) { Alert.alert("Status cannot move backwards", `${currentStatus} orders cannot be changed to ${nextStatus}.`); return; }
    try {
      await updateAdminOrderStatus(Number(order.id), STATUS_TO_API[nextStatus]);
      await loadOrders(true);
      Alert.alert("Status updated", `${order.id} is now ${nextStatus}.`);
    } catch (cause) { console.error("Admin status update failed:", cause); setError("The status could not be saved. Please retry."); }
  }, [loadOrders]);

  const openStatusPicker = useCallback((order: Order) => {
    const currentStatus = isOrderStatus(order.status) ? order.status : "Confirmed";
    const options = STATUSES.filter((status) => canMoveStatus(currentStatus, status)).map((status) => ({ text: status, onPress: () => void updateStatus(order, status) }));
    Alert.alert("Update order status", `Order ${order.id}`, [...options, { text: "Close", style: "cancel" }]);
  }, [updateStatus]);

  const visibleOrders = useMemo(() => orders.filter((order) => filter === "All" || order.status === filter), [filter, orders]);
  const count = useCallback((status: OrderStatus) => orders.filter((order) => order.status === status).length, [orders]);
  const stats = useMemo(() => serverStats ? [{ label: "Total Orders", value: serverStats.total_orders }, { label: "Pending", value: serverStats.pending }, { label: "In Progress", value: serverStats.in_progress }, { label: "Delivered", value: serverStats.delivered }, { label: "Cancelled", value: serverStats.cancelled }] : [{ label: "Total Orders", value: orders.length }, { label: "Pending", value: count("Pending") }, { label: "In Progress", value: count("In Progress") }, { label: "Delivered", value: count("Delivered") }, { label: "Cancelled", value: count("Cancelled") }], [count, orders.length, serverStats]);

  if (hasAdminSession === false) return <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={["top", "bottom"]}><View style={styles.accessDenied}><Text style={[styles.eyebrow, { color: colors.primary }]}>LUMINA MANAGEMENT</Text><Text style={[styles.accessTitle, { color: colors.text }]}>Admin access required</Text><Text style={[styles.copy, { color: colors.textSecondary }]}>Sign in with an admin account to open the management workspace.</Text><Pressable accessibilityRole="button" onPress={() => router.replace("/admin-login")} style={[styles.primaryButton, { backgroundColor: colors.primary }]}><Text style={[styles.primaryButtonText, { color: colors.onPrimary }]}>Go to admin sign in</Text></Pressable><Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.secondaryButton}><Text style={[styles.secondaryButtonText, { color: colors.primary }]}>Back to app</Text></Pressable></View></SafeAreaView>;

  return <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={["top"]}><StatusBar barStyle={effectiveMode === "dark" ? "light-content" : "dark-content"} /><FlatList data={visibleOrders} keyExtractor={(item) => item.id} refreshing={refreshing} onRefresh={() => void loadOrders(true)} showsVerticalScrollIndicator={false} contentContainerStyle={styles.content} ListHeaderComponent={<><View style={styles.header}><LuminaLogo height={32} /><Pressable accessibilityRole="button" accessibilityLabel="Refresh orders" onPress={() => void loadOrders(true)} style={[styles.refresh, { backgroundColor: colors.accentSoft }]}>{refreshing ? <ActivityIndicator size="small" color={colors.primary} /> : <Text style={[styles.refreshText, { color: colors.primary }]}>Refresh</Text>}</Pressable></View><Text style={[styles.eyebrow, { color: colors.primary }]}>BUSINESS OVERVIEW</Text><Text style={[styles.title, { color: colors.text }]}>Admin Dashboard</Text><Text style={[styles.subtitle, { color: colors.textSecondary }]}>Manage live Laravel bookings and update their status.</Text><View style={styles.stats}>{stats.map((item) => <View key={item.label} style={[styles.statCard, { backgroundColor: colors.accentSoft }]}><Text style={[styles.statValue, { color: colors.primary }]}>{item.value}</Text><Text style={[styles.statLabel, { color: colors.textSecondary }]}>{item.label}</Text></View>)}</View><View style={styles.sectionHeader}><Text style={[styles.sectionTitle, { color: colors.text }]}>Manage Orders</Text><Text style={[styles.count, { color: colors.textSecondary }]}>{orders.length} live</Text></View><FlatList horizontal data={FILTERS} keyExtractor={(item) => item} showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters} renderItem={({ item }) => <Pressable accessibilityRole="button" accessibilityState={{ selected: filter === item }} onPress={() => setFilter(item)} style={[styles.filter, { borderColor: colors.border, backgroundColor: filter === item ? colors.primary : colors.backgroundElement }]}><Text style={[styles.filterText, { color: filter === item ? colors.onPrimary : colors.textSecondary }]}>{item}</Text></Pressable>} />{!!error && <View style={[styles.error, { backgroundColor: colors.dangerBackground }]}><Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text><Pressable accessibilityRole="button" onPress={() => void loadOrders()}><Text style={[styles.retry, { color: colors.danger }]}>Retry</Text></Pressable></View>}{loading && <View style={styles.loader}><ActivityIndicator color={colors.primary} /><Text style={[styles.copy, { color: colors.textSecondary }]}>Loading live orders…</Text></View>}</>} ListEmptyComponent={!loading ? <View style={[styles.empty, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}><Text style={[styles.emptyTitle, { color: colors.text }]}>{error ? "Orders unavailable" : "No orders in this filter"}</Text><Text style={[styles.emptyText, { color: colors.textSecondary }]}>{error ? "Retry to contact the Laravel API." : "New customer bookings will appear here."}</Text></View> : undefined} renderItem={({ item }) => <View style={[styles.orderCard, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}><View style={styles.orderTop}><View style={styles.orderInfo}><Text style={[styles.service, { color: colors.text }]}>{item.service || "Laundry Service"}</Text><Text style={[styles.orderId, { color: colors.textSecondary }]}>#{item.id}</Text></View><StatusPill status={item.status || "Confirmed"} /></View><View style={[styles.divider, { backgroundColor: colors.border }]} /><Text style={[styles.detail, { color: colors.textSecondary }]}>Customer: {item.customerName || "Not provided"}</Text><Text style={[styles.detail, { color: colors.textSecondary }]}>Phone: {item.phone || "Not provided"}</Text><Text style={[styles.detail, { color: colors.textSecondary }]}>Pickup: {item.pickup || "Not scheduled"}</Text><Text style={[styles.detail, { color: colors.textSecondary }]}>Address: {item.address || "Not provided"}</Text><Pressable accessibilityRole="button" accessibilityLabel={`Update status for order ${item.id}`} style={[styles.updateButton, { backgroundColor: colors.primary }]} onPress={() => openStatusPicker(item)}><Text style={[styles.updateButtonText, { color: colors.onPrimary }]}>Update Status</Text></Pressable></View>} ListFooterComponent={<><Pressable accessibilityRole="button" onPress={() => router.back()} style={[styles.backButton, { borderColor: colors.border }]}><Text style={[styles.backText, { color: colors.primary }]}>Back to App</Text></Pressable><Text style={[styles.note, { color: colors.textSecondary }]}>Live orders and status updates are served by the Laravel admin API.</Text></>} /></SafeAreaView>;
}

const styles = StyleSheet.create({ safe: { flex: 1 }, content: { paddingHorizontal: 20, paddingBottom: 36 }, header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 15 }, brand: { fontSize: 24, letterSpacing: 4, fontFamily: "serif" }, brandSub: { fontSize: 8, letterSpacing: 1.5, marginTop: 4 }, refresh: { minWidth: 76, minHeight: 40, paddingHorizontal: 11, borderRadius: 12, alignItems: "center", justifyContent: "center" }, refreshText: { fontWeight: "700", fontSize: 12 }, eyebrow: { fontSize: 9, letterSpacing: 1.6, marginTop: 22, fontWeight: "900" }, title: { fontSize: 32, fontFamily: "serif", fontWeight: "700", marginTop: 8 }, subtitle: { fontSize: 12, lineHeight: 19, marginTop: 8 }, stats: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 22 }, statCard: { width: "48%", flexGrow: 1, borderRadius: 16, padding: 15 }, statValue: { fontSize: 25, fontWeight: "700" }, statLabel: { fontSize: 11, marginTop: 5 }, sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 28, marginBottom: 12 }, sectionTitle: { fontSize: 21, fontFamily: "serif", fontWeight: "700" }, count: { fontSize: 11 }, filters: { gap: 8, paddingBottom: 14 }, filter: { borderWidth: 1, borderRadius: 18, paddingHorizontal: 13, paddingVertical: 9 }, filterText: { fontSize: 11, fontWeight: "700" }, loader: { alignItems: "center", gap: 10, paddingVertical: 30 }, error: { borderRadius: 14, padding: 13, marginTop: 12, flexDirection: "row", alignItems: "center", gap: 10 }, errorText: { flex: 1, fontSize: 11, lineHeight: 16 }, retry: { fontSize: 11, fontWeight: "900" }, empty: { padding: 25, alignItems: "center", borderWidth: 1, borderRadius: 16, marginTop: 10 }, emptyTitle: { fontWeight: "700", fontSize: 16 }, emptyText: { fontSize: 12, marginTop: 7, textAlign: "center" }, orderCard: { borderWidth: 1, borderRadius: 18, padding: 15, marginBottom: 13, shadowColor: BrandColors.forest, shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 2 }, orderTop: { flexDirection: "row", alignItems: "center", gap: 8 }, orderInfo: { flex: 1 }, service: { fontSize: 14, fontWeight: "700" }, orderId: { fontSize: 10, marginTop: 4 }, divider: { height: 1, marginVertical: 13 }, detail: { fontSize: 11, lineHeight: 19 }, updateButton: { borderRadius: 12, padding: 13, alignItems: "center", marginTop: 14 }, updateButtonText: { fontWeight: "700", fontSize: 12 }, backButton: { borderWidth: 1, borderRadius: 12, padding: 13, alignItems: "center", marginTop: 12 }, backText: { fontWeight: "700", fontSize: 12 }, note: { fontSize: 10, lineHeight: 16, textAlign: "center", marginTop: 18 }, accessDenied: { flex: 1, justifyContent: "center", padding: 24 }, accessTitle: { fontSize: 30, fontFamily: "serif", fontWeight: "800", marginTop: 8 }, copy: { fontSize: 12, lineHeight: 18, marginTop: 8 }, primaryButton: { borderRadius: 13, minHeight: 52, alignItems: "center", justifyContent: "center", marginTop: 22 }, primaryButtonText: { fontSize: 13, fontWeight: "800" }, secondaryButton: { alignItems: "center", padding: 14, marginTop: 4 }, secondaryButtonText: { fontSize: 12, fontWeight: "800" } });
