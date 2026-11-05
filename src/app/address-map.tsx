import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AddressMap from "@/components/AddressMap";
import { useAppTheme } from "@/providers/app-theme-provider";
import {
  isGeocodingConfigured,
  searchAddress,
  type GeocodeResult,
  type LocationPoint,
} from "@/lib/location-search";

const MAP_SELECTION_KEY = "lumina_map_selection_v1";

export default function AddressMapScreen() {
  const { colors } = useAppTheme();
  const params = useLocalSearchParams<{ latitude?: string; longitude?: string }>();
  const latitude = Array.isArray(params.latitude) ? params.latitude[0] : params.latitude;
  const longitude = Array.isArray(params.longitude) ? params.longitude[0] : params.longitude;
  const routePoint = useMemo(() => {
    if (!latitude || !longitude) return null;
    const lat = Number(latitude);
    const lon = Number(longitude);
    return Number.isFinite(lat) && Number.isFinite(lon)
      ? { latitude: lat, longitude: lon }
      : null;
  }, [latitude, longitude]);
  const [selectedPoint, setSelectedPoint] = useState<LocationPoint | null>(null);
  const point = selectedPoint ?? routePoint;
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [busy, setBusy] = useState(false);
  const [searchAttempted, setSearchAttempted] = useState(false);
  const [error, setError] = useState("");

  const locate = async () => {
    setBusy(true);
    setError("");
    try {
      let permission = await Location.getForegroundPermissionsAsync();
      if (permission.status !== "granted" && permission.canAskAgain) {
        permission = await Location.requestForegroundPermissionsAsync();
      }
      if (permission.status !== "granted") {
        setError("Location access was not granted. You can still search or enter the full address manually.");
        if (!permission.canAskAgain) {
          Alert.alert(
            "Location permission is off",
            "Enable location in system settings if you want to place the pickup pin using your current location.",
            [
              { text: "Not now", style: "cancel" },
              { text: "Open settings", onPress: () => void Linking.openSettings() },
            ],
          );
        }
        return;
      }
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setSelectedPoint({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    } catch (locationError) {
      console.error("Could not retrieve current location:", locationError);
      setError("Current location is unavailable. Check your device location settings and try again, or enter the address manually.");
    } finally {
      setBusy(false);
    }
  };

  const explainAndLocate = () => {
    Alert.alert(
      "Use your current location?",
      "Lumina uses your location only to place a pickup pin for the address you choose. Your location is not collected in the background. You can enter the address manually instead.",
      [
        { text: "Enter manually", style: "cancel" },
        { text: "Continue", onPress: () => void locate() },
      ],
    );
  };

  const findAddress = async () => {
    setBusy(true);
    setError("");
    setSearchAttempted(true);
    try {
      const matches = await searchAddress(query);
      setResults(matches);
      if (matches.length === 0) setError("No matching addresses were returned. Check the spelling or enter the address manually.");
    } catch (searchError) {
      console.error("Address search failed:", searchError);
      setError(searchError instanceof Error ? searchError.message : "Address search failed. Try again or enter the address manually.");
      setResults([]);
    } finally {
      setBusy(false);
    }
  };

  const confirm = async () => {
    if (!point) return;
    try {
      const selectedResult = results.find(
        (result) =>
          result.latitude === point.latitude &&
          result.longitude === point.longitude,
      );
      await AsyncStorage.setItem(
        MAP_SELECTION_KEY,
        JSON.stringify({ point, label: selectedResult?.label ?? "" }),
      );
      router.back();
    } catch (saveError) {
      console.error("Map selection could not be saved:", saveError);
      setError("The selected map location could not be saved. Please try again.");
    }
  };

  const buttonStyle = {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Pressable onPress={() => router.back()} accessibilityRole="button">
          <Text style={[styles.back, { color: colors.primary }]}>←  Back to address</Text>
        </Pressable>
        <Text style={[styles.eyebrow, { color: colors.primary }]}>PICKUP LOCATION</Text>
        <Text style={[styles.title, { color: colors.text }]}>Place a map pin</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Confirm the address details separately. A pin does not verify address accuracy or pickup serviceability.
        </Text>

        <Pressable
          accessibilityRole="button"
          disabled={busy}
          onPress={explainAndLocate}
          style={[styles.actionButton, buttonStyle, busy && styles.disabled]}
        >
          <Text style={[styles.actionText, { color: colors.onPrimary }]}>
            ⌖  Use current location
          </Text>
        </Pressable>

        <View style={[styles.searchPanel, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
          <Text style={[styles.label, { color: colors.text }]}>Search an address</Text>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={isGeocodingConfigured ? "Street, locality, or PIN code" : "Address search is not configured"}
            placeholderTextColor={colors.textSecondary}
            editable={isGeocodingConfigured && !busy}
            style={[styles.input, { backgroundColor: colors.input, borderColor: colors.border, color: colors.text }]}
            returnKeyType="search"
            onSubmitEditing={() => void findAddress()}
          />
          <Pressable
            accessibilityRole="button"
            disabled={!isGeocodingConfigured || busy || !query.trim()}
            onPress={() => void findAddress()}
            style={[styles.searchButton, { borderColor: colors.border }, (!isGeocodingConfigured || busy || !query.trim()) && styles.disabled]}
          >
            <Text style={[styles.searchText, { color: colors.primary }]}>
              {busy ? "Working…" : "Search"}
            </Text>
          </Pressable>
          {!isGeocodingConfigured && (
            <Text style={[styles.hint, { color: colors.textSecondary }]}>
              Configure EXPO_PUBLIC_GEOCODING_URL to enable search. Manual entry is always available.
            </Text>
          )}
        </View>

        {busy && <ActivityIndicator color={colors.primary} style={styles.loader} />}
        {!!error && (
          <View style={[styles.messageBox, { backgroundColor: colors.dangerBackground }]}>
            <Text style={{ color: colors.danger, fontSize: 12, lineHeight: 18 }}>{error}</Text>
            {searchAttempted && isGeocodingConfigured && (
              <Pressable onPress={() => void findAddress()} accessibilityRole="button" style={styles.retry}>
                <Text style={{ color: colors.danger, fontWeight: "800" }}>Retry search</Text>
              </Pressable>
            )}
          </View>
        )}
        {results.map((result) => {
          const selected =
            point?.latitude === result.latitude &&
            point.longitude === result.longitude;
          return (
            <Pressable
              key={`${result.latitude},${result.longitude}`}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => setSelectedPoint(result)}
              style={[
                styles.result,
                {
                  backgroundColor: selected ? colors.backgroundSelected : colors.backgroundElement,
                  borderColor: selected ? colors.primary : colors.border,
                },
              ]}
            >
              <Text style={[styles.resultTitle, { color: colors.text }]}>{result.label}</Text>
              <Text style={[styles.hint, { color: colors.textSecondary }]}>
                {result.latitude.toFixed(5)}, {result.longitude.toFixed(5)}
              </Text>
            </Pressable>
          );
        })}

        <View style={styles.mapSection}>
          <AddressMap point={point} onPointChange={setSelectedPoint} />
          <Text style={[styles.hint, { color: colors.textSecondary }]}>
            {point
              ? `Selected pin: ${point.latitude.toFixed(5)}, ${point.longitude.toFixed(5)}. Tap the map to move it.`
              : "Search for a place or use your current location to place a pin. You may also skip this and enter the address manually."}
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          disabled={!point || busy}
          onPress={() => void confirm()}
          style={[styles.actionButton, buttonStyle, (!point || busy) && styles.disabled]}
        >
          <Text style={[styles.actionText, { color: colors.onPrimary }]}>
            Confirm this pin
          </Text>
        </Pressable>
        <Pressable onPress={() => router.back()} accessibilityRole="button" style={styles.manualButton}>
          <Text style={[styles.manualText, { color: colors.primary }]}>Continue with manual address</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: 18, paddingBottom: 36 },
  back: { fontSize: 13, fontWeight: "800", paddingVertical: 10 },
  eyebrow: { fontSize: 10, fontWeight: "800", letterSpacing: 1.7, marginTop: 10 },
  title: { fontSize: 30, fontWeight: "800", marginTop: 4 },
  subtitle: { fontSize: 12, lineHeight: 18, marginTop: 7, marginBottom: 17 },
  actionButton: { minHeight: 48, borderRadius: 12, borderWidth: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 14 },
  actionText: { color: "#FFFDFA", fontSize: 13, fontWeight: "800" },
  disabled: { opacity: 0.5 },
  searchPanel: { borderWidth: 1, borderRadius: 14, padding: 13, marginTop: 14 },
  label: { fontSize: 12, fontWeight: "800", marginBottom: 8 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 11, paddingVertical: 12, fontSize: 13 },
  searchButton: { alignSelf: "flex-start", borderWidth: 1, borderRadius: 9, paddingHorizontal: 14, paddingVertical: 9, marginTop: 9 },
  searchText: { fontSize: 12, fontWeight: "800" },
  hint: { fontSize: 11, lineHeight: 16, marginTop: 7 },
  loader: { marginTop: 14 },
  messageBox: { borderRadius: 10, padding: 12, marginTop: 12 },
  retry: { alignSelf: "flex-start", paddingVertical: 8 },
  result: { borderWidth: 1, borderRadius: 12, padding: 12, marginTop: 8 },
  resultTitle: { fontSize: 12, fontWeight: "700" },
  mapSection: { marginTop: 16, marginBottom: 15 },
  manualButton: { alignItems: "center", padding: 14 },
  manualText: { fontSize: 12, fontWeight: "800" },
});
