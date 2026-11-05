import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useThemedStyles } from "@/hooks/use-themed-styles";
import { fetchServices, type CatalogService } from "@/lib/laundry-api";

export default function SearchScreen() {
  const styles = useThemedStyles(baseStyles);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CatalogService[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const normalizedQuery = query.trim();

  useEffect(() => {
    if (!normalizedQuery) {
      const timeout = setTimeout(() => {
        setResults([]);
        setLoading(false);
        setSearched(false);
        setError("");
      }, 0);
      return () => clearTimeout(timeout);
    }

    let active = true;
    const timeout = setTimeout(() => {
      setLoading(true);
      setError("");
      void fetchServices(normalizedQuery)
        .then((services) => {
          if (active) {
            setResults(services);
            setSearched(true);
          }
        })
        .catch((cause: unknown) => {
          if (active) {
            setResults([]);
            setSearched(true);
            setError(cause instanceof Error ? cause.message : "Could not search services.");
          }
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }, 300);

    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [normalizedQuery, retryCount]);

  const emptyMessage = useMemo(
    () => (normalizedQuery ? `No services found for “${normalizedQuery}”.` : "Start typing to find laundry services."),
    [normalizedQuery],
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Pressable accessibilityRole="button" onPress={() => router.back()}>
          <Text style={styles.back}>←  Back</Text>
        </Pressable>
        <Text style={styles.eyebrow}>FIND THE RIGHT CARE</Text>
        <Text style={styles.title}>Search services</Text>
        <Text style={styles.copy}>Search the configured Lumina service catalogue by name or care type.</Text>
        <TextInput
          autoFocus
          value={query}
          onChangeText={setQuery}
          placeholder="Try wash & fold or dry cleaning"
          placeholderTextColor={styles.placeholder.color as string}
          returnKeyType="search"
          accessibilityLabel="Search laundry services"
          style={styles.input}
        />

        {loading ? (
          <View style={styles.state}><ActivityIndicator color={styles.accent.color as string} /><Text style={styles.copy}>Searching services…</Text></View>
        ) : error ? (
          <View style={styles.panel}>
            <Text style={styles.panelTitle}>Search is unavailable</Text>
            <Text style={styles.copy}>{error}</Text>
            <Pressable accessibilityRole="button" onPress={() => setRetryCount((count) => count + 1)}>
              <Text style={styles.link}>Try again</Text>
            </Pressable>
          </View>
        ) : results.length === 0 ? (
          <View style={styles.panel}>
            <Text style={styles.panelTitle}>{searched ? "No matching services" : "Discover services"}</Text>
            <Text style={styles.copy}>{emptyMessage}</Text>
            {!normalizedQuery && <Pressable accessibilityRole="button" onPress={() => router.push("/services")}><Text style={styles.link}>Browse all services →</Text></Pressable>}
          </View>
        ) : (
          <View style={styles.results}>
            <Text style={styles.resultCount}>{results.length} {results.length === 1 ? "service" : "services"}</Text>
            {results.map((service) => (
              <Pressable
                key={service.id}
                accessibilityRole="button"
                accessibilityLabel={`View ${service.name}, from ₹${service.price}`}
                onPress={() => router.push({ pathname: "/service-details", params: { id: String(service.id) } })}
                style={styles.result}
              >
                <View style={styles.resultIcon}><Text style={styles.iconText}>◇</Text></View>
                <View style={styles.resultCopy}>
                  <Text style={styles.resultTitle}>{service.name}</Text>
                  <Text style={styles.copy}>{service.category || service.vendor_name || "Laundry care"}</Text>
                  <Text style={styles.price}>From ₹{service.price.toLocaleString("en-IN")}</Text>
                </View>
                <Text style={styles.arrow}>→</Text>
              </Pressable>
            ))}
          </View>
        )}
        <Text style={styles.note}>Prices and availability come from the configured service catalogue.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const baseStyles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F7F5F0" },
  content: { padding: 20, paddingBottom: 36 },
  back: { color: "#214738", fontSize: 14, fontWeight: "700", paddingVertical: 12 },
  eyebrow: { color: "#2F674A", fontSize: 10, fontWeight: "900", letterSpacing: 1.5, marginTop: 15 },
  title: { color: "#17241B", fontSize: 31, fontWeight: "700", fontFamily: "serif", marginTop: 6 },
  copy: { color: "#4B5B50", fontSize: 12, lineHeight: 18, marginTop: 5 },
  input: { backgroundColor: "#FFFDFA", borderWidth: 1, borderColor: "#CDD8CE", borderRadius: 13, padding: 14, color: "#17241B", fontSize: 14, marginTop: 18 },
  placeholder: { color: "#4B5B50" },
  panel: { backgroundColor: "#FFFDFA", borderWidth: 1, borderColor: "#CDD8CE", borderRadius: 16, padding: 17, marginTop: 18 },
  panelTitle: { color: "#17241B", fontSize: 15, fontWeight: "800" },
  state: { alignItems: "center", padding: 28, gap: 8 },
  results: { marginTop: 20, gap: 10 },
  resultCount: { color: "#4B5B50", fontSize: 11, fontWeight: "700", marginBottom: 2 },
  result: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#FFFDFA", borderWidth: 1, borderColor: "#CDD8CE", borderRadius: 15, padding: 13 },
  resultIcon: { width: 42, height: 42, borderRadius: 13, backgroundColor: "#E3EEE6", alignItems: "center", justifyContent: "center" },
  iconText: { color: "#214738", fontSize: 23 },
  resultCopy: { flex: 1 },
  resultTitle: { color: "#17241B", fontSize: 14, fontWeight: "800" },
  price: { color: "#2F674A", fontSize: 11, fontWeight: "800", marginTop: 5 },
  arrow: { color: "#214738", fontSize: 19, fontWeight: "800" },
  link: { color: "#2F674A", fontSize: 12, fontWeight: "800", marginTop: 12 },
  note: { color: "#4B5B50", fontSize: 10, lineHeight: 15, textAlign: "center", marginTop: 20 },
  accent: { color: "#2F674A" },
});
