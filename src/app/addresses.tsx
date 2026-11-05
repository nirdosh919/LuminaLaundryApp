import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
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
import {
  deleteAddress,
  EMPTY_ADDRESS,
  formatAddress,
  getSelectedAddressId,
  loadAddresses,
  saveAddress,
  setDefaultAddress,
  setSelectedAddressId,
  type AddressLabel,
  type SavedAddress,
} from "@/lib/address-book";
import type { LocationPoint } from "@/lib/location-search";
import { useAppTheme } from "@/providers/app-theme-provider";
import { useThemedStyles } from "@/hooks/use-themed-styles";

const MAP_SELECTION_KEY = "lumina_map_selection_v1";

export default function AddressesScreen() {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(baseStyles);
  const params = useLocalSearchParams<{ latitude?: string; longitude?: string }>();
  const latitude = Array.isArray(params.latitude) ? params.latitude[0] : params.latitude;
  const longitude = Array.isArray(params.longitude) ? params.longitude[0] : params.longitude;
  const initialCoordinates = (() => {
    if (!latitude || !longitude) return null;
    const lat = Number(latitude);
    const lon = Number(longitude);
    return Number.isFinite(lat) && Number.isFinite(lon)
      ? { latitude: lat, longitude: lon }
      : null;
  })();
  const [items, setItems] = useState<SavedAddress[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<SavedAddress>(() => ({
    ...EMPTY_ADDRESS,
    coordinates: initialCoordinates,
  }));
  const [editing, setEditing] = useState(Boolean(initialCoordinates));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(async (isActive: () => boolean = () => true) => {
    setLoading(true);
    setError("");
    try {
      const [addresses, selected] = await Promise.all([
        loadAddresses(),
        AsyncStorage.getItem("lumina_selected_address_v1"),
      ]);
      if (!isActive()) return;
      setItems(addresses);
      setSelectedId(selected);

      const mapSelection = await AsyncStorage.getItem(MAP_SELECTION_KEY);
      if (mapSelection) {
        let value: unknown;
        try {
          value = JSON.parse(mapSelection) as unknown;
        } catch {
          throw new Error("The selected map pin could not be read.");
        }
        if (value && typeof value === "object" && !Array.isArray(value)) {
          const selection = value as { point?: unknown; label?: unknown };
          if (selection.point && typeof selection.point === "object") {
            const point = selection.point as LocationPoint;
            if (
              typeof point.latitude === "number" &&
              Number.isFinite(point.latitude) &&
              typeof point.longitude === "number" &&
              Number.isFinite(point.longitude)
            ) {
              setDraft((current) => ({
                ...current,
                coordinates: point,
                street:
                  !current.street.trim() && typeof selection.label === "string"
                    ? selection.label
                    : current.street,
              }));
              setEditing(true);
            }
          }
        }
        await AsyncStorage.removeItem(MAP_SELECTION_KEY);
      }
    } catch (loadError) {
      console.error("Address book load failed:", loadError);
      if (isActive()) {
        setError(loadError instanceof Error ? loadError.message : "Could not load saved addresses.");
      }
    } finally {
      if (isActive()) setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      void reload(() => active);
      return () => {
        active = false;
      };
    }, [reload]),
  );

  const beginNew = () => {
    setDraft({ ...EMPTY_ADDRESS, label: items.length === 0 ? "Home" : "Other" });
    setEditing(true);
  };

  const save = async () => {
    setError("");
    try {
      const next = await saveAddress(draft);
      setItems(next);
      const saved = next.find((item) => item.id === (draft.id || next[0]?.id));
      if (saved && !selectedId) {
        await setSelectedAddressId(saved.id);
        setSelectedId(saved.id);
      }
      setDraft(EMPTY_ADDRESS);
      setEditing(false);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save this address.");
    }
  };

  const choose = async (item: SavedAddress) => {
    try {
      await setSelectedAddressId(item.id);
      setSelectedId(item.id);
      router.back();
    } catch (selectionError) {
      console.error("Address selection failed:", selectionError);
      setError(selectionError instanceof Error ? selectionError.message : "Could not select this address.");
    }
  };

  const remove = (item: SavedAddress) => {
    Alert.alert(
      "Remove saved address?",
      `Remove ${item.label === "Other" ? item.customLabel || "this address" : item.label}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => {
            void deleteAddress(item.id)
              .then(setItems)
              .then(() => {
                if (selectedId === item.id) {
                  return getSelectedAddressId().then(setSelectedId);
                }
              })
              .catch((removeError: unknown) => {
                Alert.alert(
                  "Address not removed",
                  removeError instanceof Error ? removeError.message : "Please try again.",
                );
              });
          },
        },
      ],
    );
  };

  const field = (
    key: keyof Pick<
      SavedAddress,
      | "customLabel"
      | "houseNumber"
      | "street"
      | "locality"
      | "landmark"
      | "city"
      | "state"
      | "pincode"
      | "phone"
      | "instructions"
    >,
    title: string,
    placeholder: string,
    options: { phone?: boolean; multiline?: boolean } = {},
  ) => (
    <View style={styles.field} key={key}>
      <Text style={[styles.label, { color: colors.text }]}>{title}</Text>
      <TextInput
        value={draft[key]}
        onChangeText={(value) =>
          setDraft((current) => ({
            ...current,
            [key]: options.phone ? value.replace(/\D/g, "") : value,
          }))
        }
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        style={[
          styles.input,
          { backgroundColor: colors.input, borderColor: colors.border, color: colors.text },
          options.multiline && styles.multiline,
        ]}
        keyboardType={options.phone ? "phone-pad" : "default"}
        maxLength={options.phone ? (key === "phone" ? 10 : 6) : undefined}
        multiline={options.multiline}
      />
    </View>
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Pressable onPress={() => router.back()} accessibilityRole="button">
          <Text style={[styles.back, { color: colors.primary }]}>←  Back</Text>
        </Pressable>
        <Text style={[styles.eyebrow, { color: colors.primary }]}>PICKUP LOCATIONS</Text>
        <Text style={[styles.title, { color: colors.text }]}>Saved addresses</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Select a pickup address or manage the addresses saved on this device.
        </Text>

        {!!error && (
          <View style={[styles.errorBox, { backgroundColor: colors.dangerBackground }]}>
            <Text style={{ color: colors.danger, fontSize: 12, lineHeight: 18 }}>{error}</Text>
          </View>
        )}

        {editing ? (
          <View style={[styles.card, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
            <Text style={[styles.section, { color: colors.text }]}>
              {draft.id ? "Edit address" : "Add address"}
            </Text>
            <Text style={[styles.label, styles.kindLabel, { color: colors.text }]}>Address label</Text>
            <View style={styles.chips}>
              {(["Home", "Work", "Other"] as AddressLabel[]).map((label) => (
                <Pressable
                  key={label}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: draft.label === label }}
                  onPress={() => setDraft((current) => ({ ...current, label }))}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: draft.label === label ? colors.backgroundSelected : colors.backgroundElement,
                      borderColor: draft.label === label ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text style={[styles.chipText, { color: draft.label === label ? colors.primary : colors.text }]}>
                    {label}
                  </Text>
                </Pressable>
              ))}
            </View>
            {draft.label === "Other" && field("customLabel", "Custom label", "e.g. Studio")}
            {field("houseNumber", "House or flat number", "House 12, Flat 4B")}
            {field("street", "Street", "Street or road name")}
            {field("locality", "Locality", "Area or neighborhood")}
            {field("landmark", "Landmark (optional)", "Near a recognizable place")}
            <View style={styles.twoColumns}>
              <View style={styles.flex}>{field("city", "City", "City")}</View>
              <View style={styles.flex}>{field("state", "State", "State")}</View>
            </View>
            {field("pincode", "PIN code", "6-digit PIN code", { phone: true })}
            {field("phone", "Contact mobile (optional)", "10-digit mobile", { phone: true })}
            {field("instructions", "Pickup instructions (optional)", "Gate access or handover notes", { multiline: true })}
            <Text style={[styles.hint, { color: colors.textSecondary }]}>
              Address entry is manual. A map pin does not confirm serviceability.
            </Text>
            <Pressable
              onPress={async () => {
                try {
                  await AsyncStorage.removeItem(MAP_SELECTION_KEY);
                  router.push({
                    pathname: "/address-map",
                    params: {
                      latitude: draft.coordinates ? String(draft.coordinates.latitude) : "",
                      longitude: draft.coordinates ? String(draft.coordinates.longitude) : "",
                    },
                  });
                } catch (mapError) {
                  setError(mapError instanceof Error ? mapError.message : "Could not open map selection.");
                }
              }}
              style={[styles.mapButton, { borderColor: colors.primary }]}
            >
              <Text style={[styles.mapButtonText, { color: colors.primary }]}>
                {draft.coordinates ? "Adjust map pin" : "Choose map pin (optional)"}
              </Text>
            </Pressable>
            {!!draft.coordinates && (
              <Text style={[styles.hint, { color: colors.textSecondary }]}>
                Pin: {draft.coordinates.latitude.toFixed(5)}, {draft.coordinates.longitude.toFixed(5)}
              </Text>
            )}
            <Pressable onPress={() => void save()} style={[styles.primary, { backgroundColor: colors.primary }]}>
              <Text style={styles.primaryText}>Save address</Text>
            </Pressable>
            <Pressable onPress={() => { setDraft(EMPTY_ADDRESS); setEditing(false); }} style={styles.cancel}>
              <Text style={[styles.link, { color: colors.primary }]}>Cancel</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable onPress={beginNew} style={[styles.addButton, { backgroundColor: colors.primary }]}>
            <Text style={styles.primaryText}>＋  Add new address</Text>
          </Pressable>
        )}

        {loading ? (
          <ActivityIndicator color={colors.primary} style={styles.loader} />
        ) : items.length === 0 && !editing ? (
          <View style={[styles.empty, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
            <Text style={[styles.section, { color: colors.text }]}>No saved addresses</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Add an address manually. Map and GPS selection are optional.
            </Text>
          </View>
        ) : (
          items.map((item) => (
            <View key={item.id} style={[styles.card, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
              <View style={styles.cardHead}>
                <View style={styles.flex}>
                  <Text style={[styles.addressLabel, { color: colors.text }]}>
                    {item.label === "Other" ? item.customLabel || "Other" : item.label}
                  </Text>
                  {item.isDefault && <Text style={[styles.defaultTag, { color: colors.primary }]}>DEFAULT</Text>}
                </View>
                {selectedId === item.id && <Text style={[styles.selectedTag, { color: colors.success }]}>SELECTED</Text>}
              </View>
              <Text style={[styles.address, { color: colors.textSecondary }]}>{formatAddress(item)}</Text>
              {!!item.landmark && (
                <Text style={[styles.meta, { color: colors.textSecondary }]}>Landmark: {item.landmark}</Text>
              )}
              {!!item.phone && <Text style={[styles.meta, { color: colors.textSecondary }]}>Phone: {item.phone}</Text>}
              {!!item.instructions && (
                <Text style={[styles.meta, { color: colors.textSecondary }]}>Pickup note: {item.instructions}</Text>
              )}
              <View style={styles.actions}>
                <Pressable onPress={() => void choose(item)} style={[styles.primarySmall, { backgroundColor: colors.primary }]}>
                  <Text style={styles.primaryText}>Use this address</Text>
                </Pressable>
                <Pressable onPress={() => void setDefaultAddress(item.id).then((next) => {
                  setItems(next);
                  setSelectedId(item.id);
                }).catch((e: unknown) => setError(e instanceof Error ? e.message : "Could not update default address."))}>
                  <Text style={[styles.link, { color: colors.primary }]}>Set default</Text>
                </Pressable>
              </View>
              <View style={styles.secondaryActions}>
                <Pressable onPress={() => { setDraft(item); setEditing(true); }}>
                  <Text style={[styles.link, { color: colors.primary }]}>Edit</Text>
                </Pressable>
                <Pressable onPress={() => remove(item)}>
                  <Text style={[styles.removeText, { color: colors.danger }]}>Remove</Text>
                </Pressable>
              </View>
            </View>
          ))
        )}
        <Text style={[styles.note, { color: colors.textSecondary }]}>
          Saved on this device. Address selection does not verify pickup coverage or availability.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const baseStyles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: 18, paddingBottom: 42 },
  back: { fontSize: 13, fontWeight: "800", paddingVertical: 9 },
  eyebrow: { fontSize: 10, fontWeight: "800", letterSpacing: 1.7, marginTop: 11 },
  title: { fontSize: 30, fontWeight: "800", marginTop: 4 },
  subtitle: { fontSize: 12, lineHeight: 18, marginTop: 7, marginBottom: 15 },
  card: { borderWidth: 1, borderRadius: 15, padding: 15, marginBottom: 11 },
  section: { fontSize: 17, fontWeight: "800" },
  field: { marginTop: 11 },
  label: { fontSize: 12, fontWeight: "700", marginBottom: 6 },
  kindLabel: { marginTop: 14 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 11, paddingVertical: 11, fontSize: 13 },
  multiline: { minHeight: 72, textAlignVertical: "top" },
  twoColumns: { flexDirection: "row", gap: 10 },
  flex: { flex: 1 },
  chips: { flexDirection: "row", gap: 8 },
  chip: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 13, paddingVertical: 9 },
  chipText: { fontSize: 12, fontWeight: "800" },
  mapButton: { borderWidth: 1, borderRadius: 10, padding: 11, alignItems: "center", marginTop: 11 },
  mapButtonText: { fontSize: 12, fontWeight: "800" },
  primary: { borderRadius: 11, padding: 13, alignItems: "center", marginTop: 14 },
  primarySmall: { borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 },
  primaryText: { color: "#FFFDFA", fontSize: 12, fontWeight: "800" },
  cancel: { alignItems: "center", padding: 10 },
  link: { fontSize: 12, fontWeight: "800" },
  addressLabel: { fontSize: 15, fontWeight: "800" },
  defaultTag: { fontSize: 9, fontWeight: "900", marginTop: 3 },
  selectedTag: { fontSize: 9, fontWeight: "900" },
  cardHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  address: { fontSize: 12, lineHeight: 18, marginTop: 8 },
  meta: { fontSize: 11, lineHeight: 16, marginTop: 5 },
  actions: { flexDirection: "row", alignItems: "center", gap: 14, marginTop: 13 },
  secondaryActions: { flexDirection: "row", gap: 18, marginTop: 13 },
  removeText: { fontSize: 12, fontWeight: "800" },
  addButton: { borderRadius: 12, padding: 14, alignItems: "center", marginBottom: 12 },
  empty: { borderWidth: 1, borderRadius: 15, padding: 20, alignItems: "center" },
  hint: { fontSize: 11, lineHeight: 16, marginTop: 7 },
  errorBox: { borderRadius: 10, padding: 11, marginBottom: 12 },
  note: { fontSize: 10, lineHeight: 15, textAlign: "center", marginTop: 13 },
  loader: { marginTop: 24 },
});
