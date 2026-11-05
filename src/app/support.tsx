import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppTheme } from "@/providers/app-theme-provider";

const COMPLAINTS_KEY = "lumina_support_complaints_v1";

export default function SupportScreen() {
  const { colors } = useAppTheme();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [contact, setContact] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const submit = async () => {
    setError("");
    if (subject.trim().length < 3 || message.trim().length < 10 || contact.trim().length < 5) {
      setError("Add a subject, describe the issue in at least 10 characters, and provide a contact method.");
      return;
    }
    setBusy(true);
    try {
      const raw = await AsyncStorage.getItem(COMPLAINTS_KEY);
      const existing: unknown = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(existing)) throw new Error("Saved support requests could not be read.");
      const request = { id: `LOCAL-${Date.now()}`, subject: subject.trim(), message: message.trim(), contact: contact.trim(), createdAt: new Date().toISOString(), status: "Saved on this device" };
      await AsyncStorage.setItem(COMPLAINTS_KEY, JSON.stringify([request, ...existing]));
      setSaved(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save this request. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={["top"]}>
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Pressable accessibilityRole="button" onPress={() => router.back()}><Text style={[styles.back, { color: colors.primary }]}>← Back</Text></Pressable>
      <Text style={[styles.eyebrow, { color: colors.primary }]}>WE’RE HERE TO HELP</Text>
      <Text style={[styles.title, { color: colors.text }]}>Support & complaints</Text>
      <Text style={[styles.copy, { color: colors.textSecondary }]}>Describe what happened and leave a way for the team to reach you.</Text>
      <View style={[styles.card, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
        {saved ? <>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Request saved locally</Text>
          <Text style={[styles.copy, { color: colors.textSecondary }]}>Your request is stored on this device. It has not been sent to Lumina support.</Text>
          <Pressable accessibilityRole="button" onPress={() => { setSubject(""); setMessage(""); setContact(""); setSaved(false); }} style={[styles.primary, { backgroundColor: colors.primary }]}><Text style={[styles.primaryText, { color: colors.onPrimary }]}>Write another request</Text></Pressable>
        </> : <>
          <Text style={[styles.label, { color: colors.text }]}>Subject</Text>
          <TextInput value={subject} onChangeText={setSubject} placeholder="e.g. Question about my order" placeholderTextColor={colors.textSecondary} maxLength={100} style={[styles.input, { color: colors.text, borderColor: colors.border }]} accessibilityLabel="Complaint subject" />
          <Text style={[styles.label, { color: colors.text }]}>What can we help with?</Text>
          <TextInput value={message} onChangeText={setMessage} placeholder="Share the details…" placeholderTextColor={colors.textSecondary} multiline maxLength={1500} textAlignVertical="top" style={[styles.input, styles.message, { color: colors.text, borderColor: colors.border }]} accessibilityLabel="Complaint details" />
          <Text style={[styles.counter, { color: colors.textSecondary }]}>{message.length}/1500</Text>
          <Text style={[styles.label, { color: colors.text }]}>Email or phone</Text>
          <TextInput value={contact} onChangeText={setContact} placeholder="How should we reach you?" placeholderTextColor={colors.textSecondary} autoCapitalize="none" keyboardType="email-address" maxLength={120} style={[styles.input, { color: colors.text, borderColor: colors.border }]} accessibilityLabel="Contact email or phone" />
          {!!error && <Text accessibilityRole="alert" style={[styles.error, { color: colors.danger }]}>{error}</Text>}
          <Pressable accessibilityRole="button" disabled={busy} onPress={() => void submit()} style={[styles.primary, { backgroundColor: colors.primary }, busy && styles.disabled]}>{busy ? <ActivityIndicator color={colors.onPrimary} /> : <Text style={[styles.primaryText, { color: colors.onPrimary }]}>Save request on this device</Text>}</Pressable>
        </>}
      </View>
      <Text style={[styles.note, { color: colors.textSecondary }]}>Backend support ticket delivery is not configured or verified. For urgent issues, use a verified contact channel from your service provider.</Text>
    </ScrollView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({ safe: { flex: 1 }, content: { padding: 20, paddingBottom: 40 }, back: { fontSize: 13, fontWeight: "700", paddingVertical: 12 }, eyebrow: { fontSize: 9, letterSpacing: 1.7, fontWeight: "900", marginTop: 16 }, title: { fontSize: 29, fontFamily: "serif", fontWeight: "700", marginTop: 6 }, copy: { fontSize: 12, lineHeight: 19, marginTop: 8 }, card: { borderWidth: 1, borderRadius: 18, padding: 17, marginTop: 20 }, cardTitle: { fontSize: 17, fontFamily: "serif", fontWeight: "700" }, label: { fontSize: 11, fontWeight: "800", marginTop: 15, marginBottom: 7 }, input: { borderWidth: 1, borderRadius: 11, paddingHorizontal: 12, paddingVertical: 11, fontSize: 13, backgroundColor: "#FFFDFA" }, message: { minHeight: 125 }, counter: { textAlign: "right", fontSize: 9, marginTop: 4 }, primary: { borderRadius: 12, padding: 14, alignItems: "center", marginTop: 17, minHeight: 48, justifyContent: "center" }, primaryText: { fontSize: 12, fontWeight: "800" }, error: { fontSize: 11, lineHeight: 16, marginTop: 10 }, note: { fontSize: 10, lineHeight: 16, textAlign: "center", marginTop: 16 }, disabled: { opacity: 0.6 } });
