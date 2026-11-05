import { router, useFocusEffect } from "expo-router";
import { useState, useCallback } from "react";
import {
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BrandColors } from "@/constants/theme";
import {
  getSelectedAddressId,
  loadAddresses,
  type SavedAddress,
} from "@/lib/address-book";
import { useAppTheme } from "@/providers/app-theme-provider";
import { useThemedStyles } from "@/hooks/use-themed-styles";
import { cancelOrder, fetchOrders, type MobileOrder } from "@/lib/laundry-api";
import { PremiumBackdrop } from "@/components/premium-ui";

const GREEN = BrandColors.green;
const DARK = BrandColors.ink;
const CREAM = BrandColors.cream;
const TRACKING_STAGES = [
  "Confirmed",
  "Pickup Scheduled",
  "Picked Up",
  "Cleaning in Progress",
  "Ready for Delivery",
  "Delivered",
] as const;

type Order = {
  id: string;
  service: string;
  date?: string;
  pickup?: string;
  status: string;
  statusCode: string;
  amount?: string;
  icon?: string;
  customerName?: string;
  phone?: string;
  address?: string;
  demo: boolean;
};

function mapServerOrder(order: MobileOrder): Order {
  const created = order.created_at ? new Date(order.created_at) : null;
  const pickupDate = order.pickup_date ? new Date(`${order.pickup_date}T12:00:00`) : null;
  return {
    id: String(order.id),
    service: order.service || order.items?.map((item) => `${item.name} × ${item.quantity}`).join(", ") || "Laundry order",
    date: created && !Number.isNaN(created.getTime()) ? created.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "",
    pickup: pickupDate && !Number.isNaN(pickupDate.getTime()) ? `${pickupDate.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}${order.pickup_time_slot ? ` · ${order.pickup_time_slot}` : ""}` : "Not scheduled",
    status: order.status_label || order.status,
    statusCode: order.status,
    amount: `₹${order.total_amount.toLocaleString("en-IN")}`,
    icon: "◉", address: order.address || undefined, demo: false,
  };
}

function getTrackingStage(status: string): number {
  const normalized = status.toLowerCase().replace(/[\s-]+/g, "_");
  if (["pending", "confirmed", "pickup_scheduled"].includes(normalized)) return 0;
  if (normalized === "picked_up") return 2;
  if (["in_progress", "cleaning_in_progress"].includes(normalized)) return 3;
  if (["ready", "ready_for_delivery", "out_for_delivery"].includes(normalized)) return 4;
  if (["delivered", "completed"].includes(normalized)) return 5;
  return -1;
}

const filters = ["All", "Upcoming", "Completed", "Cancelled"];

export default function OrdersScreen() {
  const { effectiveMode } = useAppTheme();
  const styles = useThemedStyles(baseStyles);
  const [filter, setFilter] = useState("All");
  const [savedOrders, setSavedOrders] = useState<Order[]>([]);
  const [trackingOrderId, setTrackingOrderId] = useState<string | null>(null);
  const [pendingCancelId, setPendingCancelId] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [selectedAddress, setSelectedAddress] = useState<SavedAddress | null>(null);

  const reloadOrders = useCallback(async (isActive: () => boolean = () => true) => {
    setLoading(true);
    setLoadError("");
    try {
      const [addresses, selectedId] = await Promise.all([
        loadAddresses(),
        getSelectedAddressId(),
      ]);
      const bookings: Order[] = [];
      bookings.push(...(await fetchOrders()).map(mapServerOrder));
      if (isActive()) {
        setSavedOrders(bookings);
        setSelectedAddress(
          addresses.find((item) => item.id === selectedId) ??
            addresses.find((item) => item.isDefault) ??
            null,
        );
      }
    } catch (error) {
      console.error("Orders load failed:", error);
      if (isActive()) setLoadError(error instanceof Error ? error.message : "Please try again.");
    } finally {
      if (isActive()) setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    let active = true;
    void reloadOrders(() => active);
    return () => { active = false; };
  }, [reloadOrders]));

  const allOrders = savedOrders;

  const filteredOrders = allOrders.filter((order) => {
    if (filter === "Upcoming") {
      const stage = getTrackingStage(order.statusCode);
      return stage >= 0 && stage < TRACKING_STAGES.length - 1;
    }
    if (filter === "Completed") {
      return getTrackingStage(order.statusCode) === TRACKING_STAGES.length - 1;
    }
    if (filter === "Cancelled") return order.statusCode.toLowerCase() === "cancelled";
    return true;
  });

  const cancelBooking = (id: string) => {
    setPendingCancelId(id);
    setActionError("");
  };

  const confirmCancelBooking = async (id: string) => {
    setActionError("");
    try {
      await cancelOrder(Number(id));
      setPendingCancelId(null);
      await reloadOrders();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Could not cancel this order.");
      setPendingCancelId(null);
    }
  };

  const reorderBooking = async (_id: string) => {
    setActionError("Reordering is unavailable because the order API does not return service item and variant IDs.");
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}><PremiumBackdrop>
      <StatusBar
        barStyle={effectiveMode === "dark" ? "light-content" : "dark-content"}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push("/addresses")}
            style={styles.locationHeader}
          >
            <Text style={styles.locationIcon}>⌖</Text>
            <View>
              <Text style={styles.locationCaption}>PICKUP ADDRESS</Text>
              <Text style={styles.locationTitle}>
                {selectedAddress
                  ? `${selectedAddress.label === "Other" ? selectedAddress.customLabel || "Other" : selectedAddress.label} · ${selectedAddress.city}`
                  : "Choose pickup address"}
              </Text>
            </View>
            <Text style={styles.locationChevron}>⌄</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Notifications"
            onPress={() => router.push("/notifications")}
            style={styles.headerIcon}
          >
            <Text style={styles.headerIconText}>♧</Text>
          </Pressable>
        </View>

        <Text style={styles.eyebrow}>YOUR LAUNDRY</Text>
        <Text style={styles.title}>Orders</Text>
        {!loading && !loadError && allOrders.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>◷</Text>
            <Text style={styles.emptyTitle}>No active orders</Text>
            <Text style={styles.emptyText}>
              Your clean-clothes journey starts here. Schedule a pickup in under a minute.
            </Text>
            <Pressable
              style={styles.emptyAction}
              onPress={() => router.push("/services")}
            >
              <Text style={styles.emptyActionText}>Explore services  →</Text>
            </Pressable>
          </View>
        ) : (
          <>
        <Text style={styles.subtitle}>
          Keep track of your laundry, from pickup to delivery.
        </Text>
        <View style={styles.summary}>
          <View style={styles.summaryIcon}>
            <Text style={styles.summaryIconText}>◷</Text>
          </View>
          <View style={styles.summaryBody}>
            <Text style={styles.summaryTitle}>Your laundry overview</Text>
            <Text style={styles.summarySubtitle}>
              {allOrders.length} orders in your history
            </Text>
          </View>
          <Text style={styles.summaryArrow}>→</Text>
        </View>

        <View style={styles.filters}>
          {filters.map((item) => (
            <Pressable
              key={item}
              onPress={() => setFilter(item)}
              style={[styles.filter, filter === item && styles.activeFilter]}
            >
              <Text
                style={[
                  styles.filterText,
                  filter === item && styles.activeFilterText,
                ]}
              >
                {item}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {filter === "All" ? "Recent Orders" : filter + " Orders"}
          </Text>
          <Text style={styles.count}>{filteredOrders.length} orders</Text>
        </View>

        {loading && (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Loading your server orders…</Text>
          </View>
        )}
        {!loading && !!loadError && (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Could not load bookings</Text>
            <Text style={styles.emptyText}>{loadError}</Text>
            <Pressable style={styles.detailsButton} onPress={() => void reloadOrders()}>
              <Text style={styles.detailsButtonText}>Retry</Text>
            </Pressable>
          </View>
        )}
        {!!actionError && <Text style={styles.actionError}>{actionError}</Text>}
        {!loading && !loadError && filteredOrders.map((order) => {
          const completed = ["completed", "delivered"].includes(order.statusCode.toLowerCase());
          const inProgress = ["in_progress", "cleaning_in_progress"].includes(order.statusCode.toLowerCase());
          const isTracking = trackingOrderId === order.id;
          const trackingStage = getTrackingStage(order.statusCode);
          const isCancelled = order.statusCode.toLowerCase() === "cancelled";
          const isDelivered = ["delivered", "completed"].includes(order.statusCode.toLowerCase());

          return (
            <View
              key={order.id}
              style={styles.orderCard}
            >
              <View style={styles.cardTop}>
                <View style={styles.serviceIconBox}>
                  <Text style={styles.serviceIcon}>{order.icon}</Text>
                </View>

                <View style={styles.orderInfo}>
                  <Text style={styles.serviceName}>{order.service}</Text>
                  <Text style={styles.orderId}>Order #{order.id}</Text>
                </View>

                <View
                  style={[
                    styles.statusBadge,
                    completed
                      ? styles.completedBadge
                      : isCancelled
                        ? styles.cancelledBadge
                      : inProgress
                        ? styles.progressBadge
                        : styles.confirmedBadge,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      completed
                        ? styles.completedText
                        : isCancelled
                          ? styles.cancelledText
                        : inProgress
                          ? styles.progressText
                          : styles.confirmedText,
                    ]}
                  >
                    {order.status}
                  </Text>
                </View>
              </View>

              <View style={styles.cardDivider} />

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Pickup schedule</Text>
                <Text style={styles.detailValue}>{order.pickup}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Order date</Text>
                <Text style={styles.detailValue}>{order.date}</Text>
              </View>

              <View style={styles.cardBottom}>
                <View>
                  <Text style={styles.amountLabel}>Order amount</Text>
                  <Text style={styles.amount}>{order.amount}</Text>
                </View>
                <View style={styles.orderActions}>
                  {!order.demo && <Pressable
                    style={styles.detailsButton}
                    onPress={() => router.push({ pathname: "/order-details" as never, params: { id: order.id } })}
                  >
                    <Text style={styles.detailsButtonText}>View Details ↗</Text>
                  </Pressable>}
                  {order.demo && <Pressable
                    style={styles.detailsButton}
                    onPress={() => router.push({ pathname: "/order-details" as never, params: { id: order.id } })}
                  >
                    <Text style={styles.detailsButtonText}>View Details ↗</Text>
                  </Pressable>}
                  {order.demo && !isCancelled && (
                    <Pressable
                      style={styles.detailsButton}
                      accessibilityRole="button"
                      accessibilityState={{ expanded: isTracking }}
                      onPress={() =>
                        setTrackingOrderId(isTracking ? null : order.id)
                      }
                    >
                      <Text style={styles.detailsButtonText}>
                        {isTracking ? "Hide Tracking" : "Track Order"}
                      </Text>
                    </Pressable>
                  )}
                  {!order.demo && order.statusCode.toLowerCase() === "pending" && (
                    <Pressable style={styles.detailsButton} onPress={() => cancelBooking(order.id)}>
                      <Text style={styles.detailsButtonText}>Cancel order</Text>
                    </Pressable>
                  )}
                  {order.demo && !isCancelled && (
                    <Pressable style={styles.detailsButton} onPress={() => void reorderBooking(order.id)}>
                      <Text style={styles.detailsButtonText}>Reorder</Text>
                    </Pressable>
                  )}
                </View>
              </View>
              {pendingCancelId === order.id && (
                <View style={styles.confirmPanel}>
                  <Text style={styles.confirmText}>This pending order will be cancelled with the laundry provider.</Text>
                  <View style={styles.confirmActions}>
                    <Pressable accessibilityRole="button" onPress={() => void confirmCancelBooking(order.id)} style={styles.cancelConfirmButton}>
                      <Text style={styles.cancelConfirmText}>Confirm cancellation</Text>
                    </Pressable>
                    <Pressable accessibilityRole="button" onPress={() => setPendingCancelId(null)} style={styles.keepButton}>
                      <Text style={styles.keepButtonText}>Keep it</Text>
                    </Pressable>
                  </View>
                </View>
              )}
              {isTracking && (
                <View style={styles.trackingPanel}>
                  <Text style={styles.trackingTitle}>Order Tracking</Text>
                  <Text style={styles.trackingDetail}>Order ID: {order.id}</Text>
                  <Text style={styles.trackingDetail}>Service: {order.service}</Text>
                  <Text style={styles.trackingDetail}>
                    Pickup schedule: {order.pickup || "Not provided"}
                  </Text>
                  <Text style={styles.trackingDetail}>
                    Current status: {order.status}
                  </Text>

                  {isCancelled ? (
                    <Text style={styles.trackingMessage}>
                      This booking was cancelled. It is not in the active delivery timeline.
                    </Text>
                  ) : trackingStage >= 0 ? (
                    <>
                      {isDelivered && (
                        <Text style={styles.trackingMessage}>
                          This order has been delivered.
                        </Text>
                      )}
                      <View style={styles.timeline}>
                        {TRACKING_STAGES.map((stage, index) => {
                          const isCurrent = index === trackingStage;
                          const isComplete = index < trackingStage;
                          return (
                            <View key={stage} style={styles.timelineRow}>
                              <View style={styles.timelineMarkerColumn}>
                                <View
                                  style={[
                                    styles.timelineMarker,
                                    (isCurrent || isComplete) &&
                                      styles.timelineMarkerActive,
                                  ]}
                                >
                                  <Text style={styles.timelineMarkerText}>
                                    {isComplete ? "✓" : isCurrent ? "•" : ""}
                                  </Text>
                                </View>
                                {index < TRACKING_STAGES.length - 1 && (
                                  <View
                                    style={[
                                      styles.timelineConnector,
                                      isComplete && styles.timelineConnectorActive,
                                    ]}
                                  />
                                )}
                              </View>
                              <View style={styles.timelineStage}>
                                <Text
                                  style={[
                                    styles.timelineStageText,
                                    (isCurrent || isComplete) &&
                                      styles.timelineStageTextActive,
                                  ]}
                                >
                                  {stage}
                                </Text>
                                <Text style={styles.timelineStageState}>
                                  {isCurrent
                                    ? "Current"
                                    : isComplete
                                      ? "Complete"
                                      : "Upcoming"}
                                </Text>
                              </View>
                            </View>
                          );
                        })}
                      </View>
                      <Text style={styles.demoDisclaimer}>
                        Static demo timeline only. No live tracking or shop updates are connected.
                      </Text>
                    </>
                  ) : (
                    <Text style={styles.trackingMessage}>
                      A delivery timeline is not available for this status.
                    </Text>
                  )}
                </View>
              )}
            </View>
          );
        })}

        {!loading && !loadError && allOrders.length > 0 && filteredOrders.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>▤</Text>
            <Text style={styles.emptyTitle}>No orders here yet</Text>
            <Text style={styles.emptyText}>
              Your orders will appear here when available.
            </Text>
          </View>
        )}
          </>
        )}

        <View style={styles.noteBox}>
          <Text style={styles.noteTitle}>Server orders</Text>
          <Text style={styles.noteText}>
            Orders are loaded from your authenticated Lumina account. Pending orders can be cancelled through the provider API; detailed status history is available from each order.
          </Text>
        </View>

        <Text style={styles.footer}>LUMINA · CARE IN EVERY THREAD</Text>
      </ScrollView>
    </PremiumBackdrop></SafeAreaView>
  );
}

const baseStyles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: CREAM },
  content: { paddingHorizontal: 20, paddingBottom: 30 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 15,
  },
  locationHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  locationIcon: { color: DARK, fontSize: 23, fontWeight: "700" },
  locationCaption: { color: "#6F7D75", fontSize: 9, letterSpacing: 1, fontWeight: "700" },
  locationTitle: { color: DARK, fontSize: 13, fontWeight: "800", marginTop: 3 },
  locationChevron: { color: DARK, fontSize: 17, marginLeft: 1 },
  headerIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "#E9F1ED",
    alignItems: "center",
    justifyContent: "center",
  },
  headerIconText: { color: GREEN, fontSize: 23 },
  eyebrow: { color: GREEN, fontSize: 9, letterSpacing: 1.6, marginTop: 22 },
  title: {
    color: DARK,
    fontSize: 34,
    fontFamily: "serif",
    fontWeight: "700",
    marginTop: 8,
  },
  subtitle: { color: "#6F7D75", fontSize: 12, lineHeight: 19, marginTop: 8 },
  summary: {
    backgroundColor: "#E9F1ED",
    borderRadius: 17,
    padding: 15,
    marginTop: 24,
    flexDirection: "row",
    alignItems: "center",
  },
  summaryIcon: {
    width: 43,
    height: 43,
    borderRadius: 13,
    backgroundColor: "#E9F1ED",
    alignItems: "center",
    justifyContent: "center",
  },
  summaryIconText: { color: GREEN, fontSize: 23 },
  summaryBody: { flex: 1, marginLeft: 12 },
  summaryTitle: { color: DARK, fontSize: 13, fontWeight: "700" },
  summarySubtitle: { color: "#6F7D75", fontSize: 10, marginTop: 5 },
  summaryArrow: { color: GREEN, fontSize: 21 },
  filters: { flexDirection: "row", gap: 8, marginTop: 25 },
  filter: {
    paddingHorizontal: 17,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#E9F1ED",
  },
  activeFilter: { backgroundColor: GREEN },
  filterText: { color: "#6F7D75", fontSize: 11, fontWeight: "600" },
  activeFilterText: { color: "#FFFFFF" },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 26,
    marginBottom: 13,
  },
  sectionTitle: {
    color: DARK,
    fontSize: 21,
    fontFamily: "serif",
    fontWeight: "700",
  },
  count: { color: "#6F7D75", fontSize: 10 },
  orderCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DDE5DF",
    borderRadius: 17,
    padding: 15,
    marginBottom: 13,
  },
  cardTop: { flexDirection: "row", alignItems: "center" },
  serviceIconBox: {
    width: 43,
    height: 43,
    borderRadius: 13,
    backgroundColor: "#E9F1ED",
    alignItems: "center",
    justifyContent: "center",
  },
  serviceIcon: { color: GREEN, fontSize: 24 },
  orderInfo: { flex: 1, marginLeft: 11 },
  serviceName: { color: DARK, fontSize: 13, fontWeight: "700" },
  orderId: { color: "#6F7D75", fontSize: 10, marginTop: 5 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 6, borderRadius: 10 },
  confirmedBadge: { backgroundColor: "#E9F1ED" },
  progressBadge: { backgroundColor: "#FBF1E2" },
  completedBadge: { backgroundColor: "#DDE5DF" },
  cancelledBadge: { backgroundColor: "#F7E3DF" },
  statusText: { fontSize: 9, fontWeight: "700" },
  confirmedText: { color: GREEN },
  progressText: { color: "#8A5B16" },
  completedText: { color: "#6F7D75" },
  cancelledText: { color: "#C0392B" },
  cardDivider: { height: 1, backgroundColor: "#DDE5DF", marginVertical: 15 },
  detailRow: { marginBottom: 11 },
  detailLabel: { color: "#6F7D75", fontSize: 10 },
  detailValue: { color: DARK, fontSize: 11, fontWeight: "600", marginTop: 5 },
  cardBottom: {
    borderTopWidth: 1,
    borderTopColor: "#DDE5DF",
    paddingTop: 13,
    marginTop: 3,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  orderActions: { alignItems: "flex-end", gap: 8 },
  trackingPanel: {
    backgroundColor: "#E9F1ED",
    borderRadius: 14,
    padding: 14,
    marginTop: 15,
    borderWidth: 1,
    borderColor: "#DDE5DF",
  },
  trackingTitle: {
    color: DARK,
    fontSize: 16,
    fontFamily: "serif",
    fontWeight: "700",
    marginBottom: 8,
  },
  trackingDetail: { color: "#6F7D75", fontSize: 11, lineHeight: 18 },
  trackingMessage: {
    color: GREEN,
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 18,
    marginTop: 12,
  },
  timeline: { marginTop: 16 },
  timelineRow: { flexDirection: "row", minHeight: 43 },
  timelineMarkerColumn: { alignItems: "center", width: 22 },
  timelineMarker: {
    width: 18,
    height: 18,
    borderWidth: 1.5,
    borderColor: "#DDE5DF",
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    zIndex: 1,
  },
  timelineMarkerActive: { backgroundColor: GREEN, borderColor: GREEN },
  timelineMarkerText: { color: "#FFFFFF", fontSize: 10, lineHeight: 13 },
  timelineConnector: {
    position: "absolute",
    top: 18,
    bottom: 0,
    width: 2,
    backgroundColor: "#DDE5DF",
  },
  timelineConnectorActive: { backgroundColor: GREEN },
  timelineStage: {
    flex: 1,
    paddingLeft: 10,
    paddingBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  timelineStageText: { color: "#6F7D75", fontSize: 11 },
  timelineStageTextActive: { color: DARK, fontWeight: "700" },
  timelineStageState: { color: "#6F7D75", fontSize: 9 },
  demoUpdateButton: {
    backgroundColor: GREEN,
    borderRadius: 10,
    alignItems: "center",
    padding: 12,
    marginTop: 8,
  },
  demoUpdateText: { color: "#FFFFFF", fontSize: 11, fontWeight: "700" },
  demoDisclaimer: {
    color: "#6F7D75",
    fontSize: 9,
    lineHeight: 14,
    textAlign: "center",
    marginTop: 9,
  },
  amountLabel: { color: "#6F7D75", fontSize: 9 },
  amount: { color: GREEN, fontSize: 12, fontWeight: "700", marginTop: 5 },
  detailsButton: {
    borderWidth: 1,
    borderColor: "#DDE5DF",
    borderRadius: 10,
    paddingHorizontal: 11,
    paddingVertical: 10,
  },
  detailsButtonText: { color: GREEN, fontSize: 10, fontWeight: "700" },
  actionError: { color: "#C0392B", fontSize: 12, marginBottom: 10 },
  confirmPanel: { backgroundColor: "#E9F1ED", borderRadius: 12, padding: 12, marginTop: 12 },
  confirmText: { color: DARK, fontSize: 11, lineHeight: 16 },
  confirmActions: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 10 },
  cancelConfirmButton: { backgroundColor: "#C0392B", borderRadius: 9, paddingHorizontal: 11, paddingVertical: 9 },
  cancelConfirmText: { color: "#FFFFFF", fontSize: 10, fontWeight: "800" },
  keepButton: { paddingHorizontal: 8, paddingVertical: 9 },
  keepButtonText: { color: GREEN, fontSize: 10, fontWeight: "800" },
  empty: {
    alignItems: "center",
    paddingVertical: 35,
    backgroundColor: "#FFFFFF",
    borderRadius: 17,
    marginTop: 10,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#DDE5DF",
    padding: 24,
    marginTop: 24,
  },
  emptyStateIcon: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#E9F1ED",
    color: GREEN,
    fontSize: 32,
    lineHeight: 68,
    textAlign: "center",
    overflow: "hidden",
  },
  emptyAction: {
    alignSelf: "stretch",
    backgroundColor: GREEN,
    borderRadius: 12,
    alignItems: "center",
    padding: 14,
    marginTop: 18,
  },
  emptyActionText: { color: "#FFFFFF", fontSize: 12, fontWeight: "800" },
  emptyIcon: { color: GREEN, fontSize: 35 },
  emptyTitle: { color: DARK, fontSize: 16, fontWeight: "700", marginTop: 12 },
  emptyText: { color: "#6F7D75", fontSize: 11, marginTop: 7 },
  noteBox: {
    backgroundColor: "#E9F1ED",
    borderRadius: 14,
    padding: 15,
    marginTop: 12,
  },
  noteTitle: { color: GREEN, fontSize: 11, fontWeight: "700" },
  noteText: { color: "#6F7D75", fontSize: 10, lineHeight: 16, marginTop: 6 },
  footer: {
    textAlign: "center",
    color: "#6F7D75",
    fontSize: 8,
    letterSpacing: 2,
    marginTop: 24,
  },
});
