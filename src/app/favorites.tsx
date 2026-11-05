import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useThemedStyles } from "@/hooks/use-themed-styles";
import { fetchServices, type CatalogService } from "@/lib/laundry-api";

type FavoriteKey = number | string;

export default function FavoritesScreen() {
  const styles = useThemedStyles(baseStyles);
  const [favoriteKeys, setFavoriteKeys] = useState<FavoriteKey[]>([]);
  const [services, setServices] = useState<CatalogService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async (isActive: () => boolean = () => true) => {
    setLoading(true);
    setError("");
    try {
      const [catalog, rawFavorites] = await Promise.all([
        fetchServices(),
        AsyncStorage.getItem("lumina_favorites"),
      ]);
      const parsed: unknown = rawFavorites ? JSON.parse(rawFavorites) : [];
      if (!Array.isArray(parsed)) {
        throw new Error("Saved favourites have an unsupported format.");
      }
      const keys = parsed.filter((key): key is FavoriteKey =>
        typeof key === "number" || typeof key === "string",
      );
      if (keys.length !== parsed.length) {
        throw new Error("Saved favourites have an unsupported format.");
      }
      if (!isActive()) return;
      setServices(catalog);
      setFavoriteKeys(keys);
    } catch (cause) {
      if (isActive()) {
        setError(cause instanceof Error ? cause.message : "Could not load favourites.");
      }
    } finally {
      if (isActive()) setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      void load(() => active);
      return () => {
        active = false;
      };
    }, [load]),
  );

  const favorites = useMemo(
    () => services.filter((service) => favoriteKeys.includes(service.id) || favoriteKeys.includes(service.name)),
    [favoriteKeys, services],
  );

  const remove = async (service: CatalogService) => {
    const next = favoriteKeys.filter((key) => key !== service.id && key !== service.name);
    try {
      await AsyncStorage.setItem("lumina_favorites", JSON.stringify(next));
      setFavoriteKeys(next);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not update favourites.");
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable onPress={() => router.back()} accessibilityRole="button">
          <Text style={styles.back}>←  Back</Text>
        </Pressable>
        <Text style={styles.eyebrow}>YOUR SHORTLIST</Text>
        <Text style={styles.title}>Favourites</Text>
        <Text style={styles.sub}>Keep the services you use most close at hand.</Text>
        {!!error && (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Could not load favourites</Text>
            <Text style={styles.sub}>{error}</Text>
            <Pressable style={styles.button} onPress={() => void load()}>
              <Text style={styles.buttonText}>Try again</Text>
            </Pressable>
          </View>
        )}
        {loading && <ActivityIndicator color="#214738" />}
        {!loading && !error && favorites.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.heart}>♡</Text>
            <Text style={styles.emptyTitle}>Nothing saved yet</Text>
            <Text style={styles.sub}>Tap the heart on a service to save it here.</Text>
            <Pressable style={styles.button} onPress={() => router.push("/services")}>
              <Text style={styles.buttonText}>Browse services</Text>
            </Pressable>
          </View>
        )}
        {!loading && !error && favorites.map((service, index) => (
          <View key={service.id} style={styles.card}>
            <View style={styles.icon}>
              <Text style={styles.iconText}>{["◉", "✧", "≋", "◇", "▱"][index % 5]}</Text>
            </View>
            <View style={styles.body}>
              <Text style={styles.name}>{service.name}</Text>
              <Text style={styles.price}>From ₹{service.price.toLocaleString("en-IN")}</Text>
              <View style={styles.actions}>
                <Pressable
                  style={styles.add}
                  onPress={() => router.push({ pathname: "/service-details", params: { id: String(service.id) } })}
                >
                  <Text style={styles.buttonText}>View service</Text>
                </Pressable>
                <Pressable onPress={() => void remove(service)}>
                  <Text style={styles.remove}>Remove</Text>
                </Pressable>
              </View>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Remove ${service.name} from favourites`}
              onPress={() => void remove(service)}
            >
              <Text style={styles.heartSmall}>♥</Text>
            </Pressable>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const baseStyles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F7F5F0" },
  content: { padding: 20, paddingBottom: 40 },
  back: { color: "#214738", fontSize: 13, fontWeight: "700", paddingVertical: 12 },
  eyebrow: { color: "#214738", fontSize: 10, fontWeight: "800", letterSpacing: 2, marginTop: 14 },
  title: { color: "#214738", fontSize: 31, fontFamily: "serif", fontWeight: "700", marginTop: 5 },
  sub: { color: "#4B5B50", fontSize: 12, lineHeight: 18, marginTop: 7, marginBottom: 18 },
  empty: { backgroundColor: "#FFFDFA", borderRadius: 18, padding: 23, alignItems: "center", borderWidth: 1, borderColor: "#CDD8CE", marginTop: 10 },
  heart: { fontSize: 38, color: "#214738" },
  emptyTitle: { color: "#214738", fontSize: 19, fontWeight: "800", marginTop: 7 },
  button: { backgroundColor: "#214738", borderRadius: 11, paddingHorizontal: 18, paddingVertical: 13, marginTop: 16 },
  buttonText: { color: "#FFFDFA", fontSize: 12, fontWeight: "800" },
  card: { backgroundColor: "#FFFDFA", borderWidth: 1, borderColor: "#CDD8CE", borderRadius: 15, padding: 13, marginBottom: 10, flexDirection: "row", alignItems: "flex-start", gap: 11 },
  icon: { width: 43, height: 43, borderRadius: 13, backgroundColor: "#E3EEE6", alignItems: "center", justifyContent: "center" },
  iconText: { color: "#214738", fontSize: 22 },
  body: { flex: 1 },
  name: { color: "#214738", fontSize: 14, fontWeight: "800" },
  price: { color: "#4B5B50", fontSize: 11, marginTop: 4 },
  actions: { flexDirection: "row", alignItems: "center", gap: 14, marginTop: 11 },
  add: { backgroundColor: "#214738", borderRadius: 9, paddingHorizontal: 13, paddingVertical: 9 },
  remove: { color: "#A94442", fontSize: 11, fontWeight: "700" },
  heartSmall: { color: "#A94442", fontSize: 20, padding: 5 },
});
