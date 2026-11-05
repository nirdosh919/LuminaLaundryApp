import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppTheme } from "@/providers/app-theme-provider";
import { loadCart, saveCart, type CartItem } from "@/lib/cart-storage";

const formatINR = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);

export default function CartScreen() {
  const { colors } = useAppTheme();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items],
  );
  const itemCount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items],
  );

  const refreshCart = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setItems(await loadCart());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not read your bag.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setLoading(true);
      setError("");
      void loadCart()
        .then((cart) => {
          if (active) setItems(cart);
        })
        .catch((cause: unknown) => {
          if (active) {
            setError(cause instanceof Error ? cause.message : "Could not read your bag.");
          }
        })
        .finally(() => {
          if (active) setLoading(false);
        });
      return () => {
        active = false;
      };
    }, []),
  );

  const persistItems = async (next: CartItem[]) => {
    setSaving(true);
    setError("");
    try {
      await saveCart(next);
      setItems(next);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Your bag could not be updated.");
    } finally {
      setSaving(false);
    }
  };

  const changeQuantity = (item: CartItem, delta: number) => {
    if (saving) return;
    const nextQuantity = item.quantity + delta;
    if (nextQuantity > 50) {
      Alert.alert("Quantity limit", "You can add up to 50 of each service.");
      return;
    }
    const next = nextQuantity < 1
      ? items.filter((entry) => entry.id !== item.id)
      : items.map((entry) =>
          entry.id === item.id ? { ...entry, quantity: nextQuantity } : entry,
        );
    void persistItems(next);
  };

  const removeItem = (item: CartItem) => {
    if (saving) return;
    Alert.alert("Remove service?", `Remove ${item.name} from your bag?`, [
      { text: "Keep", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => void persistItems(items.filter((entry) => entry.id !== item.id)),
      },
    ]);
  };

  const clearCart = () => {
    if (saving || items.length === 0) return;
    Alert.alert("Clear your bag?", "All selected services will be removed.", [
      { text: "Cancel", style: "cancel" },
      { text: "Clear bag", style: "destructive", onPress: () => void persistItems([]) },
    ]);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={[styles.eyebrow, { color: colors.primary }]}>YOUR SELECTION</Text>
            <Text style={[styles.title, { color: colors.text }]}>Your bag</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {itemCount} {itemCount === 1 ? "item" : "items"} ready for checkout
            </Text>
          </View>
          {items.length > 0 && (
            <Pressable accessibilityRole="button" onPress={clearCart} disabled={saving}>
              <Text style={[styles.clearText, { color: colors.danger }]}>Clear bag</Text>
            </Pressable>
          )}
        </View>

        {loading ? (
          <View style={styles.state}>
            <ActivityIndicator color={colors.primary} />
            <Text style={[styles.body, { color: colors.textSecondary }]}>Loading your bag…</Text>
          </View>
        ) : error ? (
          <View style={[styles.panel, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
            <Text style={[styles.panelTitle, { color: colors.text }]}>Bag unavailable</Text>
            <Text style={[styles.body, { color: colors.textSecondary }]}>{error}</Text>
            <Pressable accessibilityRole="button" onPress={() => void refreshCart()} style={[styles.secondaryButton, { borderColor: colors.primary }]}>
              <Text style={[styles.secondaryText, { color: colors.primary }]}>Try again</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={() => void persistItems([])} disabled={saving}>
              <Text style={[styles.clearText, { color: colors.danger }]}>Clear saved bag and start again</Text>
            </Pressable>
          </View>
        ) : items.length === 0 ? (
          <View style={[styles.panel, styles.emptyPanel, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
            <Text style={styles.emptyIcon}>🧺</Text>
            <Text style={[styles.panelTitle, { color: colors.text }]}>Your bag is empty</Text>
            <Text style={[styles.body, { color: colors.textSecondary, textAlign: "center" }]}>
              Explore the service catalogue and add the care your clothes need.
            </Text>
            <Pressable accessibilityRole="button" onPress={() => router.push("/services" as never)} style={[styles.primaryButton, { backgroundColor: colors.primary }]}>
              <Text style={[styles.primaryText, { color: colors.onPrimary }]}>Explore services</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View style={styles.listHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Selected services</Text>
              <Text style={[styles.body, { color: colors.textSecondary }]}>One shop per booking</Text>
            </View>

            {items.map((item) => (
              <View key={item.id} style={[styles.itemCard, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
                <View style={styles.itemTop}>
                  <View style={[styles.itemIcon, { backgroundColor: colors.accentSoft }]}>
                    <Text style={[styles.itemIconText, { color: colors.primary }]}>✦</Text>
                  </View>
                  <View style={styles.itemCopy}>
                    <Text style={[styles.itemName, { color: colors.text }]}>{item.name}</Text>
                    <Text style={[styles.body, { color: colors.textSecondary }]}>{formatINR(item.price)} / {item.unit}</Text>
                  </View>
                  <Text style={[styles.lineTotal, { color: colors.text }]}>{formatINR(item.price * item.quantity)}</Text>
                </View>
                <View style={styles.itemBottom}>
                  <Pressable accessibilityRole="button" accessibilityLabel={`Remove ${item.name}`} onPress={() => removeItem(item)} disabled={saving}>
                    <Text style={[styles.removeText, { color: colors.danger }]}>Remove</Text>
                  </Pressable>
                  <View style={styles.quantityControl}>
                    <Pressable accessibilityRole="button" accessibilityLabel={`Decrease ${item.name} quantity`} onPress={() => changeQuantity(item, -1)} disabled={saving} style={[styles.stepper, { borderColor: colors.border }]}>
                      <Text style={[styles.stepperText, { color: colors.primary }]}>−</Text>
                    </Pressable>
                    <Text style={[styles.quantity, { color: colors.text }]}>{item.quantity}</Text>
                    <Pressable accessibilityRole="button" accessibilityLabel={`Increase ${item.name} quantity`} onPress={() => changeQuantity(item, 1)} disabled={saving} style={[styles.stepper, { borderColor: colors.border }]}>
                      <Text style={[styles.stepperText, { color: colors.primary }]}>＋</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            ))}

            <View style={[styles.panel, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Price summary</Text>
              <View style={styles.summaryRow}>
                <Text style={[styles.body, { color: colors.textSecondary }]}>Items ({itemCount})</Text>
                <Text style={[styles.summaryValue, { color: colors.text }]}>{formatINR(subtotal)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={[styles.body, { color: colors.textSecondary }]}>Pickup and taxes</Text>
                <Text style={[styles.body, { color: colors.textSecondary }]}>Calculated at checkout</Text>
              </View>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <View style={styles.summaryRow}>
                <Text style={[styles.totalLabel, { color: colors.text }]}>Estimated subtotal</Text>
                <Text style={[styles.totalValue, { color: colors.primary }]}>{formatINR(subtotal)}</Text>
              </View>
              <Text style={[styles.note, { color: colors.textSecondary }]}>
                Final prices and availability are confirmed by Lumina when the booking is submitted.
              </Text>
              <Pressable accessibilityRole="button" onPress={() => router.push("/checkout" as never)} disabled={saving} style={[styles.primaryButton, { backgroundColor: colors.primary, opacity: saving ? 0.6 : 1 }]}>
                <Text style={[styles.primaryText, { color: colors.onPrimary }]}>
                  {saving ? "Updating bag…" : "Continue to pickup details"}
                </Text>
              </Pressable>
              <Pressable accessibilityRole="button" onPress={() => router.push("/services" as never)} style={styles.continueButton}>
                <Text style={[styles.secondaryText, { color: colors.primary }]}>＋ Add more services</Text>
              </Pressable>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: 19, paddingBottom: 42 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 22 },
  eyebrow: { fontSize: 10, fontWeight: "800", letterSpacing: 1.8 },
  title: { fontSize: 32, fontFamily: "serif", fontWeight: "700", marginTop: 5 },
  subtitle: { fontSize: 12, marginTop: 6 },
  clearText: { fontSize: 12, fontWeight: "800", paddingVertical: 8 },
  state: { alignItems: "center", justifyContent: "center", paddingVertical: 42, gap: 10 },
  body: { fontSize: 12, lineHeight: 18 },
  panel: { borderWidth: 1, borderRadius: 17, padding: 16, marginBottom: 12, gap: 11 },
  emptyPanel: { alignItems: "center", paddingVertical: 30 },
  emptyIcon: { fontSize: 38, marginBottom: 3 },
  panelTitle: { fontSize: 17, fontWeight: "800" },
  primaryButton: { minHeight: 48, borderRadius: 12, alignItems: "center", justifyContent: "center", paddingHorizontal: 16, paddingVertical: 13, marginTop: 5 },
  primaryText: { fontSize: 13, fontWeight: "800" },
  secondaryButton: { minHeight: 42, borderWidth: 1, borderRadius: 11, alignItems: "center", justifyContent: "center", paddingHorizontal: 15 },
  secondaryText: { fontSize: 12, fontWeight: "800" },
  listHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 11 },
  sectionTitle: { fontSize: 16, fontWeight: "800" },
  itemCard: { borderWidth: 1, borderRadius: 16, padding: 14, marginBottom: 10 },
  itemTop: { flexDirection: "row", alignItems: "center" },
  itemIcon: { width: 42, height: 42, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  itemIconText: { fontSize: 20, fontWeight: "800" },
  itemCopy: { flex: 1, marginLeft: 11, marginRight: 8, gap: 4 },
  itemName: { fontSize: 13, fontWeight: "800" },
  lineTotal: { fontSize: 13, fontWeight: "900" },
  itemBottom: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 13, paddingTop: 11, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "#DDE5DF" },
  removeText: { fontSize: 11, fontWeight: "700" },
  quantityControl: { flexDirection: "row", alignItems: "center", gap: 13 },
  stepper: { width: 34, height: 34, borderWidth: 1, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  stepperText: { fontSize: 18, fontWeight: "800" },
  quantity: { minWidth: 15, textAlign: "center", fontSize: 13, fontWeight: "800" },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 10 },
  summaryValue: { fontSize: 12, fontWeight: "800" },
  divider: { height: 1, marginVertical: 3 },
  totalLabel: { fontSize: 14, fontWeight: "900" },
  totalValue: { fontSize: 18, fontWeight: "900" },
  note: { fontSize: 10, lineHeight: 15 },
  continueButton: { alignItems: "center", paddingVertical: 9 },
});
