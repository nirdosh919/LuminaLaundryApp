import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { cancelDemoBooking, loadDemoBookings, type DemoBooking } from "@/lib/demo-store";
import { useAppTheme } from "@/providers/app-theme-provider";

const RESCHEDULE_KEY = "lumina_reschedule_requests_v1";
const STAGES = ["Confirmed", "Pickup Scheduled", "Picked Up", "Cleaning in Progress", "Ready for Delivery", "Delivered"];

export default function OrderDetailsScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { colors } = useAppTheme();
  const [booking, setBooking] = useState<DemoBooking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const currentStage = useMemo(() => booking?.status === "Cancelled" ? -1 : 0, [booking]);

  useEffect(() => {
    let active = true;
    loadDemoBookings().then((bookings) => {
      if (active) setBooking(bookings.find((item) => item.id === id) ?? null);
    }).catch((cause: unknown) => {
      if (active) setError(cause instanceof Error ? cause.message : "Could not load booking details.");
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  const saveRescheduleRequest = async () => {
    if (!booking || !/^\d{4}-\d{2}-\d{2}$/.test(rescheduleDate) || !rescheduleTime.trim()) {
      setNotice("Enter a date as YYYY-MM-DD and a preferred pickup time.");
      return;
    }
    setBusy(true);
    try {
      const raw = await AsyncStorage.getItem(RESCHEDULE_KEY);
      const existing: unknown = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(existing)) throw new Error("Saved requests could not be read.");
      await AsyncStorage.setItem(RESCHEDULE_KEY, JSON.stringify([{ id: `LOCAL-${Date.now()}`, bookingId: booking.id, date: rescheduleDate, time: rescheduleTime.trim(), createdAt: new Date().toISOString() }, ...existing]));
      setNotice("Reschedule preference saved on this device. It has not been sent to a provider.");
      setRescheduleDate(""); setRescheduleTime("");
    } catch (cause) { setNotice(cause instanceof Error ? cause.message : "Could not save the request."); }
    finally { setBusy(false); }
  };

  const cancelLocally = async () => {
    if (!booking) return;
    setBusy(true);
    try {
      const updated = await cancelDemoBooking(booking.id);
      setBooking(updated.find((item) => item.id === booking.id) ?? null);
      setNotice("Local demo booking cancelled. No shop was notified.");
    } catch (cause) { setNotice(cause instanceof Error ? cause.message : "Could not update the local booking."); }
    finally { setBusy(false); }
  };

  return <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={["top"]}>
    <ScrollView contentContainerStyle={styles.content}>
      <Pressable accessibilityRole="button" onPress={() => router.back()}><Text style={[styles.back, { color: colors.primary }]}>← Orders</Text></Pressable>
      {loading ? <View style={styles.state}><ActivityIndicator color={colors.primary} /><Text style={[styles.copy, { color: colors.textSecondary }]}>Loading booking details…</Text></View> : error || !booking ? <View style={[styles.card, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}><Text style={[styles.title, { color: colors.text }]}>Booking unavailable</Text><Text style={[styles.copy, { color: colors.textSecondary }]}>{error || "This local demo booking could not be found on this device."}</Text><Pressable onPress={() => router.replace("/orders")}><Text style={[styles.link, { color: colors.primary }]}>Back to orders →</Text></Pressable></View> : <>
        <Text style={[styles.eyebrow, { color: colors.primary }]}>LOCAL BOOKING · {booking.id}</Text>
        <Text style={[styles.title, { color: colors.text }]}>Order details</Text>
        <View style={[styles.card, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>{booking.items.map((item) => `${item.name} × ${item.quantity}`).join(", ")}</Text>
          <Text style={[styles.copy, { color: colors.textSecondary }]}>Status: {booking.status}</Text>
          <Text style={[styles.copy, { color: colors.textSecondary }]}>Pickup: {booking.pickupDate || "Not scheduled"}{booking.pickupTime ? ` · ${booking.pickupTime}` : ""}</Text>
          <Text style={[styles.copy, { color: colors.textSecondary }]}>Address: {booking.address}, {booking.city}</Text>
          <Text style={[styles.copy, { color: colors.textSecondary }]}>Estimate: ₹{booking.total.toLocaleString("en-IN")} · not charged</Text>
        </View>
        <View style={[styles.card, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Order timeline</Text>
          {STAGES.map((stage, index) => <View key={stage} style={styles.stageRow}><Text style={[styles.marker, { color: index <= currentStage ? colors.primary : colors.textSecondary }]}>{index < currentStage ? "✓" : index === currentStage ? "●" : "○"}</Text><Text style={[styles.stage, { color: index <= currentStage ? colors.text : colors.textSecondary }]}>{stage}{index === currentStage ? " · Current local status" : ""}</Text></View>)}
          <Text style={[styles.note, { color: colors.textSecondary }]}>Static local preview timeline. It does not receive shop updates or live tracking.</Text>
        </View>
        {booking.status === "Confirmed" && <View style={[styles.card, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Request a schedule change</Text>
          <Text style={[styles.copy, { color: colors.textSecondary }]}>Save a local preference for a different pickup time.</Text>
          <TextInput value={rescheduleDate} onChangeText={setRescheduleDate} placeholder="YYYY-MM-DD" placeholderTextColor={colors.textSecondary} style={[styles.input, { color: colors.text, borderColor: colors.border }]} accessibilityLabel="Preferred pickup date" />
          <TextInput value={rescheduleTime} onChangeText={setRescheduleTime} placeholder="Preferred time, e.g. 10:00–12:00" placeholderTextColor={colors.textSecondary} style={[styles.input, { color: colors.text, borderColor: colors.border }]} accessibilityLabel="Preferred pickup time" />
          <Pressable disabled={busy} onPress={() => void saveRescheduleRequest()} style={[styles.primary, { backgroundColor: colors.primary }]}><Text style={[styles.primaryText, { color: colors.onPrimary }]}>{busy ? "Saving…" : "Save reschedule preference"}</Text></Pressable>
          <Pressable disabled={busy} onPress={() => void cancelLocally()} style={styles.secondary}><Text style={[styles.link, { color: colors.danger }]}>Cancel local demo booking</Text></Pressable>
        </View>}
        {!!notice && <Text accessibilityRole="alert" style={[styles.note, { color: colors.primary }]}>{notice}</Text>}
        <Text style={[styles.note, { color: colors.textSecondary }]}>This device only stores demo bookings. No pickup, reschedule, cancellation, payment or refund is sent to a provider.</Text>
      </>}
    </ScrollView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({ safe: { flex: 1 }, content: { padding: 20, paddingBottom: 40 }, back: { fontSize: 13, fontWeight: "700", paddingVertical: 12 }, eyebrow: { fontSize: 9, letterSpacing: 1.3, fontWeight: "900", marginTop: 15 }, title: { fontSize: 29, fontFamily: "serif", fontWeight: "700", marginTop: 6 }, card: { borderWidth: 1, borderRadius: 16, padding: 15, marginTop: 15 }, cardTitle: { fontSize: 15, fontWeight: "800" }, copy: { fontSize: 11, lineHeight: 17, marginTop: 7 }, stageRow: { flexDirection: "row", alignItems: "center", gap: 10, minHeight: 34 }, marker: { width: 20, fontSize: 12 }, stage: { fontSize: 11 }, note: { fontSize: 10, lineHeight: 16, marginTop: 10 }, input: { borderWidth: 1, borderRadius: 10, backgroundColor: "#FFFDFA", padding: 11, marginTop: 10, fontSize: 12 }, primary: { borderRadius: 11, alignItems: "center", padding: 13, marginTop: 12 }, primaryText: { fontSize: 11, fontWeight: "800" }, secondary: { alignItems: "center", padding: 10, marginTop: 5 }, link: { fontSize: 11, fontWeight: "800", marginTop: 10 }, state: { alignItems: "center", padding: 28 } });
