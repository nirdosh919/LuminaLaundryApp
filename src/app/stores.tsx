import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { fetchServices, type CatalogService } from "@/lib/laundry-api";
import { useAppTheme } from "@/providers/app-theme-provider";

type Store = { id: number; name: string; services: CatalogService[] };

export default function StoresScreen() {
  const { colors } = useAppTheme();
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    try {
      const items = await fetchServices();
      const byVendor = new Map<number, Store>();
      items.forEach((service) => {
        const existing = byVendor.get(service.vendor_id) ?? { id: service.vendor_id, name: service.vendor_name || `Shop ${service.vendor_id}`, services: [] };
        existing.services.push(service); byVendor.set(service.vendor_id, existing);
      });
      setStores([...byVendor.values()]);
      setError("");
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : "Could not load participating shops.");
    } finally {
      setLoading(false);
    }
  }, []);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- Fetch catalogue data after mount; state updates occur when the async request settles.
  useEffect(() => { void load(); }, [load]);
  return <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={["top"]}><ScrollView contentContainerStyle={styles.content}>
    <Pressable accessibilityRole="button" onPress={() => router.back()}><Text style={[styles.back, { color: colors.primary }]}>← Back</Text></Pressable>
    <Text style={[styles.eyebrow, { color: colors.primary }]}>LOCAL SHOP DIRECTORY</Text><Text style={[styles.title, { color: colors.text }]}>Participating shops</Text>
    <Text style={[styles.copy, { color: colors.textSecondary }]}>Shops below are derived from the configured service catalogue. Live hours, distance, ratings and pickup availability are not provided here.</Text>
    {loading ? <View style={styles.state}><ActivityIndicator color={colors.primary} /><Text style={[styles.copy, { color: colors.textSecondary }]}>Loading shop directory…</Text></View> : error ? <View style={[styles.card, { borderColor: colors.border, backgroundColor: colors.backgroundElement }]}><Text style={[styles.cardTitle, { color: colors.text }]}>Shop directory unavailable</Text><Text style={[styles.copy, { color: colors.textSecondary }]}>{error}</Text><Pressable accessibilityRole="button" onPress={() => { setError(""); setLoading(true); void load(); }}><Text style={[styles.link, { color: colors.primary }]}>Retry</Text></Pressable></View> : stores.length === 0 ? <View style={[styles.card, { borderColor: colors.border, backgroundColor: colors.backgroundElement }]}><Text style={[styles.cardTitle, { color: colors.text }]}>No shops available</Text><Text style={[styles.copy, { color: colors.textSecondary }]}>The configured catalogue did not return a participating shop.</Text></View> : stores.map((store) => <Pressable key={store.id} accessibilityRole="button" onPress={() => router.push({ pathname: "/store-details" as never, params: { id: String(store.id), name: store.name } })} style={[styles.card, { borderColor: colors.border, backgroundColor: colors.backgroundElement }]}><Text style={[styles.cardTitle, { color: colors.text }]}>{store.name}</Text><Text style={[styles.copy, { color: colors.textSecondary }]}>{store.services.length} catalogue service{store.services.length === 1 ? "" : "s"}</Text><Text style={[styles.link, { color: colors.primary }]}>View shop details →</Text></Pressable>)}
    <Text style={[styles.note, { color: colors.textSecondary }]}>Catalogue availability depends on the configured backend and has not been verified against a live service.</Text>
  </ScrollView></SafeAreaView>;
}

const styles = StyleSheet.create({ safe: { flex: 1 }, content: { padding: 20, paddingBottom: 40 }, back: { fontSize: 13, fontWeight: "700", paddingVertical: 12 }, eyebrow: { fontSize: 9, letterSpacing: 1.6, fontWeight: "900", marginTop: 15 }, title: { fontSize: 29, fontFamily: "serif", fontWeight: "700", marginTop: 6 }, copy: { fontSize: 11, lineHeight: 17, marginTop: 7 }, card: { borderWidth: 1, borderRadius: 16, padding: 15, marginTop: 13 }, cardTitle: { fontSize: 14, fontWeight: "800" }, link: { fontSize: 11, fontWeight: "800", marginTop: 10 }, state: { alignItems: "center", padding: 25 }, note: { fontSize: 10, lineHeight: 16, textAlign: "center", marginTop: 16 } });
