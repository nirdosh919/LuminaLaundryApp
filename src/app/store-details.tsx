import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { fetchServices, type CatalogService } from "@/lib/laundry-api";
import { useAppTheme } from "@/providers/app-theme-provider";

export default function StoreDetailsScreen() {
  const params = useLocalSearchParams<{ id?: string; name?: string }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const name = Array.isArray(params.name) ? params.name[0] : params.name;
  const { colors } = useAppTheme();
  const [services, setServices] = useState<CatalogService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    fetchServices().then((items) => { if (active) setServices(items.filter((item) => String(item.vendor_id) === id)); }).catch((cause: unknown) => { if (active) setError(cause instanceof Error ? cause.message : "Could not load shop details."); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);
  return <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={["top"]}><ScrollView contentContainerStyle={styles.content}>
    <Pressable accessibilityRole="button" onPress={() => router.back()}><Text style={[styles.back, { color: colors.primary }]}>← Shops</Text></Pressable>
    <Text style={[styles.eyebrow, { color: colors.primary }]}>SHOP DETAILS</Text><Text style={[styles.title, { color: colors.text }]}>{name || "Participating shop"}</Text>
    <View style={[styles.card, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}><Text style={[styles.cardTitle, { color: colors.text }]}>Location & availability</Text><Text style={[styles.copy, { color: colors.textSecondary }]}>The catalogue does not provide verified address, opening hours, distance, ratings or live pickup coverage for this shop.</Text></View>
    <Text style={[styles.section, { color: colors.text }]}>Services from this shop</Text>
    {loading ? <View style={styles.state}><ActivityIndicator color={colors.primary} /><Text style={[styles.copy, { color: colors.textSecondary }]}>Loading services…</Text></View> : error ? <View style={[styles.card, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}><Text style={[styles.copy, { color: colors.danger }]}>{error}</Text></View> : services.length === 0 ? <Text style={[styles.copy, { color: colors.textSecondary }]}>No catalogue services are listed for this shop.</Text> : services.map((service) => <Pressable key={service.id} accessibilityRole="button" onPress={() => router.push({ pathname: "/service-details", params: { id: String(service.id) } })} style={[styles.card, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}><Text style={[styles.cardTitle, { color: colors.text }]}>{service.name}</Text><Text style={[styles.copy, { color: colors.textSecondary }]}>{service.description || service.category || "Laundry care"}</Text><Text style={[styles.link, { color: colors.primary }]}>From ₹{service.price.toLocaleString("en-IN")} · View service →</Text></Pressable>)}
    <Text style={[styles.note, { color: colors.textSecondary }]}>Shop details and service availability are supplied by the configured catalogue. Live backend data has not been verified.</Text>
  </ScrollView></SafeAreaView>;
}

const styles = StyleSheet.create({ safe: { flex: 1 }, content: { padding: 20, paddingBottom: 40 }, back: { fontSize: 13, fontWeight: "700", paddingVertical: 12 }, eyebrow: { fontSize: 9, letterSpacing: 1.5, fontWeight: "900", marginTop: 15 }, title: { fontSize: 29, fontFamily: "serif", fontWeight: "700", marginTop: 6 }, section: { fontSize: 17, fontFamily: "serif", fontWeight: "700", marginTop: 20 }, card: { borderWidth: 1, borderRadius: 15, padding: 14, marginTop: 11 }, cardTitle: { fontSize: 13, fontWeight: "800" }, copy: { fontSize: 11, lineHeight: 17, marginTop: 6 }, link: { fontSize: 11, fontWeight: "800", marginTop: 9 }, note: { fontSize: 10, lineHeight: 15, textAlign: "center", marginTop: 15 }, state: { alignItems: "center", padding: 22 } });
