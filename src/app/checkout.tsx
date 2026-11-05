import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppTheme } from "@/providers/app-theme-provider";
import { createBooking } from "@/lib/laundry-api";
import { getAccessToken } from "@/lib/token-storage";
import {
  formatAddress,
  getSelectedAddressId,
  loadAddresses,
  setSelectedAddressId,
  type SavedAddress,
} from "@/lib/address-book";
import {
  checkServiceability,
  getAvailablePickupSlots,
  type PickupSlot,
  type ServiceabilityResult,
} from "@/lib/pickup-availability";
import {
  getPaymentOptions,
  type PaymentMethod,
  type PaymentOptionsResult,
} from "@/lib/payments";

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
    item.quantity > 0 &&
    typeof item.unit === "string"
  );
}

function toLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatSlot(slot: PickupSlot): string {
  const date = new Date(`${slot.date}T12:00:00`);
  const dateLabel = Number.isNaN(date.getTime())
    ? slot.date
    : date.toLocaleDateString("en-IN", {
        weekday: "short",
        day: "numeric",
        month: "short",
      });
  return `${dateLabel} · ${slot.startsAt}–${slot.endsAt}`;
}

function formatSavedAddressLabel(address: SavedAddress): string {
  return address.label === "Other"
    ? address.customLabel || "Other"
    : address.label;
}

export default function CheckoutScreen() {
  const { colors } = useAppTheme();
  const [items, setItems] = useState<CartItem[]>([]);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddress] = useState("");
  const [selectedAddress, setSelectedAddressRecord] =
    useState<SavedAddress | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");
  const [instructions, setInstructions] = useState("");
  const [serviceability, setServiceability] =
    useState<ServiceabilityResult | null>(null);
  const [slots, setSlots] = useState<PickupSlot[]>([]);
  const [selectedSlotId, setSelectedSlotId] = useState("");
  const [requestedPickupDate, setRequestedPickupDate] = useState("");
  const [requestedDeliveryDate, setRequestedDeliveryDate] = useState("");
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [paymentOptions, setPaymentOptions] =
    useState<PaymentOptionsResult | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState<PaymentMethod | null>(null);
  const [busy, setBusy] = useState(false);
  const [savedReference, setSavedReference] = useState("");
  const [cleanupWarning, setCleanupWarning] = useState("");

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items],
  );
  const selectedSlot = slots.find((slot) => slot.id === selectedSlotId) ?? null;

  useFocusEffect(
    useCallback(() => {
      let active = true;
      const loadCheckout = async () => {
        try {
          const [
            cartRaw,
            profileRaw,
            addresses,
            selectedId,
            availablePayments,
          ] = await Promise.all([
            AsyncStorage.getItem("lumina_cart"),
            AsyncStorage.getItem("lumina_profile"),
            loadAddresses(),
            getSelectedAddressId(),
            getPaymentOptions(),
          ]);
          if (!active) return;

          let cart: CartItem[] = [];
          if (cartRaw) {
            const parsed: unknown = JSON.parse(cartRaw);
            if (!Array.isArray(parsed) || !parsed.every(isCartItem)) {
              throw new Error("The saved cart has an unsupported format.");
            }
            cart = parsed;
          }
          setItems(cart);
          setSavedAddresses(addresses);
          setPaymentOptions(availablePayments);

          const selected =
            addresses.find((item) => item.id === selectedId) ??
            addresses.find((item) => item.isDefault) ??
            null;
          setSelectedAddressRecord(selected);
          setSelectedAddress(selected?.id ?? "");
          if (selected) {
            setAddress(formatAddress(selected));
            setCity(selected.city);
            setState(selected.state);
            setPincode(selected.pincode);
            setInstructions(selected.instructions);
            if (selected.phone) setPhone(selected.phone);
          }

          if (profileRaw) {
            const profile: unknown = JSON.parse(profileRaw);
            if (!profile || typeof profile !== "object" || Array.isArray(profile)) {
              throw new Error("Saved profile has an unsupported format.");
            }
            const details = profile as Record<string, unknown>;
            if (typeof details.name === "string") setName(details.name);
            if (!selected) {
              if (typeof details.phone === "string") setPhone(details.phone);
              if (typeof details.address === "string") setAddress(details.address);
              if (typeof details.city === "string") setCity(details.city);
              if (typeof details.state === "string") setState(details.state);
              if (typeof details.pincode === "string") setPincode(details.pincode);
            }
          }
          setSelectedPaymentMethod(null);
        } catch (loadError) {
          console.error("Checkout data load failed:", loadError);
          if (active) {
            Alert.alert(
              "Could not load checkout details",
              loadError instanceof Error ? loadError.message : "Please try again.",
            );
          }
        }
      };
      void loadCheckout();
      return () => {
        active = false;
      };
    }, []),
  );

  const selectAddress = async (item: SavedAddress) => {
    setSelectedAddress(item.id);
    setSelectedAddressRecord(item);
    setAddress(formatAddress(item));
    setCity(item.city);
    setState(item.state);
    setPincode(item.pincode);
    setInstructions(item.instructions);
    if (item.phone) setPhone(item.phone);
    setServiceability(null);
    setSlots([]);
    setSelectedSlotId("");
    try {
      await setSelectedAddressId(item.id);
      await AsyncStorage.mergeItem(
        "lumina_profile",
        JSON.stringify({
          address: formatAddress(item),
          city: item.city,
          state: item.state,
          pincode: item.pincode,
          ...(item.phone ? { phone: item.phone } : {}),
        }),
      );
    } catch (selectionError) {
      console.error("Checkout address selection failed:", selectionError);
      Alert.alert(
        "Could not save selected address",
        selectionError instanceof Error
          ? selectionError.message
          : "Please try again.",
      );
    }
  };

  const checkPickupAddress = async () => {
    if (!selectedAddress) {
      setServiceability({
        status: "unavailable",
        message: "Save or select a structured address before checking pickup coverage.",
      });
      setSlots([]);
      return;
    }

    setCheckingAvailability(true);
    setServiceability(null);
    setSlots([]);
    setSelectedSlotId("");
    try {
      const result = await checkServiceability(selectedAddress);
      setServiceability(result);
      if (result.status !== "serviceable") return;

      const from = new Date();
      const through = new Date();
      through.setDate(through.getDate() + 14);
      const availability = await getAvailablePickupSlots(
        selectedAddress,
        toLocalDateString(from),
        toLocalDateString(through),
      );
      if (availability.status === "unavailable") {
        setServiceability({
          status: "unavailable",
          message: availability.message,
        });
        return;
      }
      setSlots(availability.slots);
      if (availability.slots.length === 0) {
        setServiceability({
          status: "unavailable",
          message: "The configured provider returned no available pickup slots.",
        });
      }
    } catch (availabilityError) {
      console.error("Pickup availability check failed:", availabilityError);
      setServiceability({
        status: "unavailable",
        message:
          availabilityError instanceof Error
            ? availabilityError.message
            : "Pickup coverage could not be checked. Please retry.",
      });
    } finally {
      setCheckingAvailability(false);
    }
  };

  const placeOrder = async () => {
    if (items.length === 0) {
      Alert.alert("Cart is empty", "Add a service before checking out.");
      return;
    }
    if (items.some((item) => item.vendor_id === 0)) {
      Alert.alert(
        "Live service required",
        "Sample services cannot be booked with the backend. Your order has not been sent or saved.",
      );
      return;
    }
    if (new Set(items.map((item) => item.vendor_id)).size > 1) {
      Alert.alert("Choose one shop", "The backend accepts one shop per booking. Your order has not been sent or saved.");
      return;
    }
    if (!(await getAccessToken())) {
      Alert.alert("Sign in required", "Sign in with a customer account before submitting a booking.");
      router.push("/login");
      return;
    }
    if (
      !name.trim() ||
      !phone.trim() ||
      !address.trim() ||
      !city.trim() ||
      !state.trim() ||
      !pincode.trim()
    ) {
      Alert.alert(
        "Details required",
        "Enter your name, mobile number, full address, city, state and PIN code.",
      );
      return;
    }
    if (!/^[6-9]\d{9}$/.test(phone.trim())) {
      Alert.alert("Invalid mobile number", "Enter a valid 10-digit Indian mobile number.");
      return;
    }
    if (!/^\d{6}$/.test(pincode.trim())) {
      Alert.alert("Invalid PIN code", "Enter a valid 6-digit PIN code.");
      return;
    }

    const pickupDateValue = selectedSlot?.date ?? requestedPickupDate.trim();
    const deliveryDateValue = requestedDeliveryDate.trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(pickupDateValue) || !/^\d{4}-\d{2}-\d{2}$/.test(deliveryDateValue) || deliveryDateValue < pickupDateValue) {
      Alert.alert("Valid dates required", "Enter pickup and delivery dates as YYYY-MM-DD. Delivery must be on or after pickup.");
      return;
    }
    setBusy(true);
    try {
      const booking = await createBooking({
        items: items.map(({ service_item_id, variant_id, quantity }) => ({ service_item_id, variant_id, quantity })),
        label: selectedAddress?.label ?? "Home",
        full_address: address.trim(),
        landmark: instructions.trim() || undefined,
        city: city.trim(), state: state.trim(), pincode: pincode.trim(),
        pickup_date: pickupDateValue,
        pickup_time_slot: selectedSlot ? `${selectedSlot.startsAt}–${selectedSlot.endsAt}` : null,
        delivery_date: deliveryDateValue,
        delivery_time_slot: null,
      });
      setSavedReference(booking.order_number || String(booking.id));
      try {
        await AsyncStorage.setItem("lumina_cart", JSON.stringify([]));
        await AsyncStorage.mergeItem(
          "lumina_profile",
          JSON.stringify({
            name: name.trim(),
            phone: phone.trim(),
            address: address.trim(),
            city: city.trim(),
            state: state.trim(),
            pincode: pincode.trim(),
          }),
        );
      } catch (storageError) {
        console.error(
        "Booking was confirmed by the server but checkout details could not be refreshed:",
          storageError,
        );
        setCleanupWarning(
          "Booking confirmed by the server, but your cart or profile could not be refreshed.",
        );
      }
    } catch (error) {
      console.error("Checkout save failed:", error);
      Alert.alert(
        "Could not place order",
        error instanceof Error ? error.message : "Please try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  const field = (
    label: string,
    value: string,
    onChangeText: (next: string) => void,
    placeholder: string,
    options: { phone?: boolean; multiline?: boolean; maxLength?: number } = {},
  ) => (
    <View style={styles.field}>
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        style={[
          styles.input,
          {
            backgroundColor: colors.input,
            borderColor: colors.border,
            color: colors.text,
          },
          options.multiline && styles.multiline,
        ]}
        keyboardType={options.phone ? "phone-pad" : "default"}
        maxLength={options.maxLength}
        multiline={options.multiline}
        textAlignVertical={options.multiline ? "top" : "center"}
      />
    </View>
  );

  const messageColor =
    serviceability?.status === "serviceable"
      ? colors.success
      : serviceability?.status === "unsupported"
        ? colors.warning
        : colors.textSecondary;
  const messageBackground =
    serviceability?.status === "serviceable"
      ? colors.successBackground
      : serviceability?.status === "unsupported"
        ? colors.warningBackground
        : colors.backgroundSelected;

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable onPress={() => router.back()} accessibilityRole="button">
          <Text style={[styles.back, { color: colors.primary }]}>←  Back to bag</Text>
        </Pressable>
        <Text style={[styles.eyebrow, { color: colors.primary }]}>
          FREE DOORSTEP PICKUP
        </Text>
        <Text style={[styles.title, { color: colors.text }]}>Schedule pickup</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Choose a saved address and check verified pickup availability.
        </Text>

        <View
          style={[
            styles.panel,
            { backgroundColor: colors.backgroundElement, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.panelTitle, { color: colors.text }]}>
            Delivery address
          </Text>
          {savedAddresses.length > 0 ? (
            <>
              <Text style={[styles.label, { color: colors.text }]}>
                Use a saved address
              </Text>
              <View style={styles.savedAddresses}>
                {savedAddresses.map((item) => {
                  const selected = selectedAddressId === item.id;
                  return (
                    <Pressable
                      key={item.id}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: selected }}
                      onPress={() => void selectAddress(item)}
                      style={[
                        styles.savedAddress,
                        {
                          backgroundColor: selected
                            ? colors.backgroundSelected
                            : colors.backgroundElement,
                          borderColor: selected ? colors.primary : colors.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.savedAddressLabel,
                          { color: selected ? colors.primary : colors.text },
                        ]}
                      >
                        {formatSavedAddressLabel(item)}
                        {item.isDefault ? " · Default" : ""}
                      </Text>
                      <Text
                        numberOfLines={2}
                        style={[
                          styles.savedAddressText,
                          { color: colors.textSecondary },
                        ]}
                      >
                        {formatAddress(item)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </>
          ) : (
            <View
              style={[
                styles.notice,
                { backgroundColor: colors.backgroundSelected },
              ]}
            >
              <Text style={[styles.hint, { color: colors.textSecondary }]}>
                Add a saved address to check pickup coverage and verified time slots.
                Enter requested pickup and delivery dates below; a verified availability provider is not connected.
              </Text>
            </View>
          )}
          {field("Full name", name, setName, "Your name")}
          {field(
            "Mobile number",
            phone,
            (value) => setPhone(value.replace(/\D/g, "")),
            "10-digit mobile number",
            { phone: true, maxLength: 10 },
          )}
          {field("Pickup address", address, setAddress, "House, street and area", {
            multiline: true,
          })}
          {field("City", city, setCity, "City")}
          {field("State", state, setState, "State")}
          {field(
            "PIN code",
            pincode,
            (value) => setPincode(value.replace(/\D/g, "")),
            "6-digit PIN code",
            { phone: true, maxLength: 6 },
          )}
          {field(
            "Pickup instructions (optional)",
            instructions,
            setInstructions,
            "Landmark or other notes",
            { multiline: true },
          )}
          <Pressable
            onPress={() => router.push("/addresses")}
            style={styles.addressLink}
            accessibilityRole="button"
          >
            <Text style={[styles.linkText, { color: colors.primary }]}>
              Manage saved addresses  →
            </Text>
          </Pressable>
        </View>

        <View
          style={[
            styles.panel,
            { backgroundColor: colors.backgroundElement, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.panelTitle, { color: colors.text }]}>
            Pickup availability
          </Text>
          <Text style={[styles.hint, { color: colors.textSecondary }]}>
            Dates and time slots are shown only when returned by a configured provider.
            Checking availability does not reserve a slot. The backend accepts requested dates without a time slot.
          </Text>
          <Text style={[styles.label, { color: colors.text }]}>Requested pickup date (YYYY-MM-DD)</Text>
          <TextInput value={requestedPickupDate} onChangeText={setRequestedPickupDate} placeholder="2026-11-01" placeholderTextColor={colors.textSecondary} style={[styles.input, { backgroundColor: colors.input, borderColor: colors.border, color: colors.text }]} autoCapitalize="none" />
          <Text style={[styles.label, { color: colors.text }]}>Requested delivery date (YYYY-MM-DD)</Text>
          <TextInput value={requestedDeliveryDate} onChangeText={setRequestedDeliveryDate} placeholder="2026-11-02" placeholderTextColor={colors.textSecondary} style={[styles.input, { backgroundColor: colors.input, borderColor: colors.border, color: colors.text }]} autoCapitalize="none" />
          <Pressable
            accessibilityRole="button"
            disabled={!selectedAddress || checkingAvailability}
            onPress={() => void checkPickupAddress()}
            style={[
              styles.outlineButton,
              { borderColor: colors.primary },
              (!selectedAddress || checkingAvailability) && styles.disabled,
            ]}
          >
            {checkingAvailability ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <Text style={[styles.linkText, { color: colors.primary }]}>
                Check address and available slots
              </Text>
            )}
          </Pressable>
          {serviceability && (
            <View style={[styles.notice, { backgroundColor: messageBackground }]}>
              <Text style={[styles.hint, { color: messageColor }]}>
                {serviceability.message}
              </Text>
            </View>
          )}
          {slots.length > 0 && (
            <>
              <Text style={[styles.label, { color: colors.text }]}>
                Available pickup slots
              </Text>
              <View style={styles.savedAddresses}>
                {slots.map((slot) => {
                  const selected = slot.id === selectedSlotId;
                  return (
                    <Pressable
                      key={slot.id}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: selected }}
                      onPress={() => { setSelectedSlotId(slot.id); setRequestedPickupDate(slot.date); }}
                      style={[
                        styles.savedAddress,
                        {
                          backgroundColor: selected
                            ? colors.backgroundSelected
                            : colors.backgroundElement,
                          borderColor: selected ? colors.primary : colors.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.savedAddressLabel,
                          { color: selected ? colors.primary : colors.text },
                        ]}
                      >
                        {formatSlot(slot)}
                      </Text>
                      {slot.cutoffAt && (
                        <Text
                          style={[
                            styles.savedAddressText,
                            { color: colors.textSecondary },
                          ]}
                        >
                          Booking cutoff: {slot.cutoffAt}
                        </Text>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            </>
          )}
        </View>

        <View
          style={[
            styles.panel,
            { backgroundColor: colors.backgroundElement, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.panelTitle, { color: colors.text }]}>Payment</Text>
          {!paymentOptions ? (
            <Text style={[styles.hint, { color: colors.textSecondary }]}>
              Checking configured payment methods…
            </Text>
          ) : paymentOptions.status === "unavailable" ? (
            <Text style={[styles.hint, { color: colors.textSecondary }]}>
              {paymentOptions.message}
            </Text>
          ) : (
            <>
              <Text style={[styles.hint, { color: colors.textSecondary }]}>
                Payment preview only. No backend payment provider is connected, so this flow will not
                start a payment or collect money.
              </Text>
              <View style={styles.paymentMethods}>
                {paymentOptions.methods.map((method) => {
                  const selected = selectedPaymentMethod === method.id;
                  return (
                    <Pressable
                      key={method.id}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: selected }}
                      onPress={() => setSelectedPaymentMethod(method.id)}
                      style={[
                        styles.method,
                        {
                          backgroundColor: selected
                            ? colors.backgroundSelected
                            : colors.backgroundElement,
                          borderColor: selected ? colors.primary : colors.border,
                        },
                      ]}
                    >
                      <Text style={[styles.methodText, { color: colors.text }]}>
                        {method.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </>
          )}
        </View>

        <View
          style={[
            styles.panel,
            { backgroundColor: colors.backgroundElement, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.panelTitle, { color: colors.text }]}>
            Order summary
          </Text>
          {items.map((item) => (
            <View key={item.id} style={styles.summaryRow}>
              <Text style={[styles.summaryText, { color: colors.textSecondary }]}>
                {item.name} × {item.quantity}
              </Text>
              <Text style={[styles.summaryValue, { color: colors.text }]}>
                ₹{(item.price * item.quantity).toLocaleString("en-IN")}
              </Text>
            </View>
          ))}
          {items.length === 0 && (
            <Text style={[styles.hint, { color: colors.textSecondary }]}>
              Your cart is empty. Go back to add a service.
            </Text>
          )}
          <View style={[styles.summaryRow, styles.total, { borderColor: colors.border }]}>
            <Text style={[styles.totalText, { color: colors.text }]}>
              Estimated total
            </Text>
            <Text style={[styles.totalText, { color: colors.text }]}>
              ₹{subtotal.toLocaleString("en-IN")}
            </Text>
          </View>
          <Text style={[styles.hint, { color: colors.textSecondary }]}>
            The server recalculates final pricing from active service rates before confirming a booking.
          </Text>
        </View>

        {savedReference ? (
          <View
            style={[
              styles.successPanel,
              { backgroundColor: colors.successBackground },
            ]}
          >
            <Text style={[styles.successTitle, { color: colors.text }]}>
              Booking confirmed
            </Text>
            <Text style={[styles.hint, { color: colors.textSecondary }]}>
              Reference {savedReference}. This does not reserve a pickup slot or
              collect payment.
            </Text>
            {!!cleanupWarning && (
              <Text style={[styles.warning, { color: colors.danger }]}>
                {cleanupWarning}
              </Text>
            )}
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push("/(tabs)/orders" as never)}
              style={[styles.submit, { backgroundColor: colors.primary }]}
            >
              <Text style={[styles.submitText, { color: colors.onPrimary }]}>
                View your orders  →
              </Text>
            </Pressable>
          </View>
        ) : (
          <Pressable
            accessibilityRole="button"
            disabled={busy || items.length === 0}
            onPress={() => void placeOrder()}
            style={[
              styles.submit,
              { backgroundColor: colors.primary },
              (busy || items.length === 0) && styles.disabled,
            ]}
          >
            <Text style={[styles.submitText, { color: colors.onPrimary }]}>
              {busy
                ? "Submitting booking…"
                : `Place booking · ₹${subtotal.toLocaleString("en-IN")}`}
            </Text>
          </Pressable>
        )}
        <Text style={[styles.disclaimer, { color: colors.textSecondary }]}>
          Booking requests are submitted to Lumina. Payment processing and pickup-slot
          reservation are unavailable until their backend providers are connected.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: 19, paddingBottom: 42 },
  back: { fontSize: 13, fontWeight: "700", paddingVertical: 11 },
  eyebrow: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.8,
    marginTop: 13,
  },
  title: { fontSize: 32, fontFamily: "serif", fontWeight: "700", marginTop: 5 },
  subtitle: { fontSize: 13, lineHeight: 19, marginTop: 6, marginBottom: 18 },
  panel: { borderWidth: 1, borderRadius: 16, padding: 16, marginBottom: 12 },
  panelTitle: { fontSize: 16, fontWeight: "800", marginBottom: 14 },
  field: { marginBottom: 12 },
  label: { fontSize: 12, fontWeight: "700", marginBottom: 7 },
  input: {
    borderWidth: 1,
    borderRadius: 11,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 13,
  },
  multiline: { height: 84 },
  addressLink: { paddingVertical: 5, alignSelf: "flex-start" },
  linkText: { fontSize: 12, fontWeight: "700", textAlign: "center" },
  savedAddresses: { gap: 8, marginBottom: 13 },
  savedAddress: { borderWidth: 1, borderRadius: 11, padding: 11 },
  savedAddressLabel: { fontSize: 12, fontWeight: "800" },
  savedAddressText: { fontSize: 11, lineHeight: 16, marginTop: 4 },
  notice: { borderRadius: 11, padding: 12, marginTop: 10 },
  outlineButton: {
    minHeight: 44,
    borderWidth: 1,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 12,
  },
  disabled: { opacity: 0.45 },
  hint: { fontSize: 11, lineHeight: 16, marginTop: 9 },
  paymentMethods: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 },
  method: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 13, paddingVertical: 10 },
  methodText: { fontSize: 12, fontWeight: "700" },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
    paddingVertical: 7,
  },
  summaryText: { fontSize: 12, flex: 1 },
  summaryValue: { fontSize: 12, fontWeight: "700" },
  total: { borderTopWidth: 1, marginTop: 7, paddingTop: 13 },
  totalText: { fontSize: 15, fontWeight: "900" },
  submit: {
    borderRadius: 13,
    alignItems: "center",
    padding: 16,
    marginTop: 4,
  },
  submitText: { fontSize: 14, fontWeight: "800" },
  successPanel: { borderRadius: 16, padding: 17, marginTop: 13 },
  successTitle: { fontSize: 16, fontWeight: "900" },
  warning: { fontSize: 11, lineHeight: 16, marginTop: 8 },
  disclaimer: { textAlign: "center", fontSize: 10, lineHeight: 15, marginTop: 13 },
});
