import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useEffect, useState } from "react";
import { getCurrentAccount } from "@/lib/auth";
import { toggleDriverStatus } from "@/lib/laundry-api";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppTheme } from "@/providers/app-theme-provider";

export default function DriverDashboardScreen() {
  const { colors } = useAppTheme();
  const [status, setStatus] = useState("unknown"); const [loading, setLoading] = useState(true); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  useEffect(() => { void getCurrentAccount().then((account) => setStatus(account?.status ?? "unknown")).catch((cause) => setError(cause instanceof Error ? cause.message : "Could not load driver status.")).finally(() => setLoading(false)); }, []);
  const toggle = async () => { setBusy(true); setError(""); try { setStatus(await toggleDriverStatus()); } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not update driver status."); } finally { setBusy(false); } };
  return <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}><View style={styles.content}><Text style={[styles.eyebrow, { color: colors.primary }]}>DRIVER ACCOUNT</Text><Text style={[styles.title, { color: colors.text }]}>Dashboard</Text><Text style={[styles.body, { color: colors.textSecondary }]}>Your assigned pickup and delivery work is managed from the live task list.</Text><View style={[styles.statusCard, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}><Text style={[styles.statusLabel, { color: colors.textSecondary }]}>AVAILABILITY</Text><Text style={[styles.status, { color: status === "available" ? colors.success : colors.text }]}>{loading ? "Loading…" : status.toUpperCase()}</Text><Pressable disabled={loading || busy || status === "busy"} onPress={() => void toggle()} style={[styles.statusButton, { borderColor: colors.primary }]}><Text style={[styles.statusButtonText, { color: colors.primary }]}>{busy ? "Updating…" : status === "available" ? "Go offline" : "Go online"}</Text></Pressable></View>{!!error && <Text style={[styles.error, { color: colors.danger }]}>{error}</Text>}<Pressable onPress={() => router.push("/driver-orders")} style={[styles.button, { backgroundColor: colors.primary }]}><Text style={styles.buttonText}>Open assigned tasks →</Text></Pressable></View></SafeAreaView>;
}

const styles = StyleSheet.create({ safe: { flex: 1 }, content: { padding: 20 }, eyebrow: { fontSize: 10, fontWeight: "900", letterSpacing: 1.6, marginTop: 15 }, title: { fontSize: 32, fontWeight: "900", marginTop: 6 }, body: { fontSize: 13, lineHeight: 20, marginTop: 14 }, statusCard: { borderWidth: 1, borderRadius: 16, padding: 15, marginTop: 22 }, statusLabel: { fontSize: 10, fontWeight: "900", letterSpacing: 1.3 }, status: { fontSize: 22, fontWeight: "900", marginTop: 7 }, statusButton: { borderWidth: 1, borderRadius: 10, padding: 11, alignItems: "center", marginTop: 13 }, statusButtonText: { fontSize: 12, fontWeight: "900" }, error: { fontSize: 12, marginTop: 12 }, button: { borderRadius: 12, padding: 15, alignItems: "center", marginTop: 20 }, buttonText: { color: "#FFFDFA", fontSize: 13, fontWeight: "900" } });
