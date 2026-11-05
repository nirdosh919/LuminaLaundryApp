import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { DEMO_SERVICES } from "@/lib/demo-store";
import { useThemedStyles } from "@/hooks/use-themed-styles";
import { useAppTheme } from "@/providers/app-theme-provider";

type CartItem = {
  id: string;
  service_item_id: number;
  variant_id: number | null;
  vendor_id: number;
  name: string;
  price: number;
  quantity: number;
  unit: string;
};

function isCartItem(value: unknown): value is CartItem {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.id === "string" &&
    typeof item.service_item_id === "number" &&
    (typeof item.variant_id === "number" || item.variant_id === null) &&
    typeof item.vendor_id === "number" &&
    typeof item.name === "string" &&
    typeof item.price === "number" &&
    Number.isFinite(item.price) &&
    typeof item.quantity === "number" &&
    Number.isInteger(item.quantity) &&
    typeof item.unit === "string"
  );
}

export default function BookingScreen() {
  const { colors } = useAppTheme();
  const params = useLocalSearchParams<{ service?: string }>();
  const incomingService = Array.isArray(params.service)
    ? params.service[0]
    : params.service;
  const initialService =
    DEMO_SERVICES.find(
      (item) => item.name.toLowerCase() === incomingService?.toLowerCase(),
    )?.id ?? DEMO_SERVICES[0].id;
  const [serviceId, setServiceId] = useState(initialService);
  const [quantity, setQuantity] = useState(1);
  const [busy, setBusy] = useState(false);
  const styles = useThemedStyles(baseStyles);
  const service = useMemo(
    () => DEMO_SERVICES.find((item) => item.id === serviceId) ?? DEMO_SERVICES[0],
    [serviceId],
  );

  const continueToCheckout = async () => {
    setBusy(true);
    try {
      const raw = await AsyncStorage.getItem("lumina_cart");
      let cart: CartItem[] = [];
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (!Array.isArray(parsed) || !parsed.every(isCartItem)) {
          throw new Error("The saved cart has an unsupported format.");
        }
        cart = parsed;
      }

      if (cart.some((item) => item.vendor_id !== 0)) {
        throw new Error("Clear your cart before adding services from another shop.");
      }
      const cartId = `${service.id}-base`;
      const existing = cart.find((item) => item.id === cartId);
      if (existing) {
        existing.quantity = Math.min(50, existing.quantity + quantity);
      } else {
        cart.push({
          id: cartId,
          service_item_id: service.id,
          variant_id: null,
          vendor_id: 0,
          name: service.name,
          price: service.price,
          quantity,
          unit: service.unit,
        });
      }
      await AsyncStorage.setItem("lumina_cart", JSON.stringify(cart));
      router.push("/checkout");
    } catch (error) {
      console.error("Could not prepare demo checkout:", error);
      Alert.alert(
        "Could not continue to checkout",
        error instanceof Error ? error.message : "Please try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable onPress={() => router.back()} accessibilityRole="button">
          <Text style={styles.back}>←  Back</Text>
        </Pressable>
        <Text style={styles.eyebrow}>LOCAL PREVIEW</Text>
        <Text style={styles.title}>Choose your service</Text>
        <Text style={styles.subtitle}>
          Select an item and continue to checkout to manage your address. Pickup
          dates and time slots are only shown when a verified provider is connected.
        </Text>

        <View style={styles.services}>
          {DEMO_SERVICES.map((item) => {
            const selected = item.id === serviceId;
            return (
              <Pressable
                key={item.id}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected }}
                onPress={() => setServiceId(item.id)}
                style={[styles.service, selected && styles.selectedService]}
              >
                <View style={styles.serviceCopy}>
                  <Text style={[styles.serviceTitle, selected && styles.selectedText]}>
                    {item.name}
                  </Text>
                  <Text style={styles.serviceDescription}>{item.description}</Text>
                  <Text style={styles.price}>
                    Sample estimate · ₹{item.price}/{item.unit}
                  </Text>
                </View>
                <Text style={styles.radio}>{selected ? "●" : "○"}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.label}>Quantity</Text>
        <View style={styles.quantityRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Decrease quantity"
            style={styles.quantityButton}
            onPress={() => setQuantity((value) => Math.max(1, value - 1))}
          >
            <Text style={styles.quantitySymbol}>−</Text>
          </Pressable>
          <Text style={styles.quantity}>{quantity}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Increase quantity"
            style={styles.quantityButton}
            onPress={() => setQuantity((value) => Math.min(50, value + 1))}
          >
            <Text style={styles.quantitySymbol}>+</Text>
          </Pressable>
        </View>

        <View style={styles.notice}>
          <Text style={styles.noticeTitle}>No pickup is scheduled yet</Text>
          <Text style={styles.noticeText}>
            This local preview does not reserve a pickup or contact a shop. Check
            provider-backed availability in checkout before relying on a time slot.
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          disabled={busy}
          style={[styles.submit, busy && styles.disabled]}
          onPress={() => void continueToCheckout()}
        >
          {busy ? (
            <ActivityIndicator color={colors.onPrimary} />
          ) : (
            <Text style={styles.submitText}>Continue to checkout  →</Text>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const baseStyles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F7F5F0" },
  content: { padding: 20, paddingBottom: 40 },
  back: { color: "#214738", fontSize: 13, fontWeight: "700", paddingVertical: 12 },
  eyebrow: { color: "#2F674A", fontSize: 10, fontWeight: "900", letterSpacing: 1.8, marginTop: 16 },
  title: { color: "#17241B", fontSize: 31, fontFamily: "serif", fontWeight: "800", marginTop: 6 },
  subtitle: { color: "#4B5B50", fontSize: 12, lineHeight: 18, marginTop: 8, marginBottom: 16 },
  services: { gap: 9 },
  service: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#CDD8CE", borderRadius: 13, padding: 13, backgroundColor: "#FFFDFA" },
  selectedService: { borderColor: "#214738", backgroundColor: "#E3EEE6" },
  serviceCopy: { flex: 1 },
  serviceTitle: { color: "#17241B", fontSize: 13, fontWeight: "800" },
  selectedText: { color: "#214738" },
  serviceDescription: { color: "#4B5B50", fontSize: 11, lineHeight: 16, marginTop: 4 },
  price: { color: "#2F674A", fontSize: 10, fontWeight: "800", marginTop: 7 },
  radio: { color: "#214738", fontSize: 18, marginLeft: 10 },
  label: { color: "#17241B", fontSize: 12, fontWeight: "700", marginTop: 20, marginBottom: 10 },
  quantityRow: { flexDirection: "row", alignItems: "center", gap: 20 },
  quantityButton: { width: 42, height: 42, borderRadius: 12, backgroundColor: "#E3EEE6", alignItems: "center", justifyContent: "center" },
  quantitySymbol: { color: "#214738", fontSize: 23 },
  quantity: { color: "#17241B", fontSize: 17, fontWeight: "700" },
  notice: { backgroundColor: "#E3EEE6", borderRadius: 14, padding: 14, marginTop: 22 },
  noticeTitle: { color: "#214738", fontSize: 12, fontWeight: "800" },
  noticeText: { color: "#4B5B50", fontSize: 11, lineHeight: 17, marginTop: 5 },
  submit: { backgroundColor: "#214738", borderRadius: 13, alignItems: "center", justifyContent: "center", padding: 16, marginTop: 18, minHeight: 50 },
  submitText: { color: "#FFFDFA", fontSize: 13, fontWeight: "800" },
  disabled: { opacity: 0.5 },
});
