import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { PremiumBackdrop, PremiumBrand, PremiumButton, PremiumCard, Reveal } from "@/components/premium-ui";
import { useAppTheme } from "@/providers/app-theme-provider";

export default function DriverLoginScreen() {
  const { colors } = useAppTheme();
  return <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}><PremiumBackdrop><ScrollView contentContainerStyle={styles.content}><Reveal><PremiumBrand partner="DRIVER WORKSPACE" /></Reveal><Reveal delay={100}><Text style={[styles.eyebrow, { color: colors.primary }]}>DRIVER ACCESS</Text><Text style={[styles.title, { color: colors.text }]}>Move every order forward.</Text><Text style={[styles.copy, { color: colors.textSecondary }]}>Stay on top of pickups, deliveries and the moments that keep customers happy.</Text></Reveal><Reveal delay={180}><PremiumCard><Text style={[styles.cardLabel, { color: colors.gold }]}>FIELD OPERATIONS</Text><Text style={[styles.cardTitle, { color: colors.text }]}>Your live task list awaits.</Text><Text style={[styles.cardCopy, { color: colors.textSecondary }]}>Sign in with your approved driver account to begin.</Text><PremiumButton onPress={() => router.push({ pathname: "/role-login", params: { role: "driver" } })}>Continue as driver</PremiumButton><Pressable onPress={() => router.back()} style={styles.back}><Text style={[styles.backText, { color: colors.primary }]}>← Back to Lumina</Text></Pressable></PremiumCard></Reveal></ScrollView></PremiumBackdrop></SafeAreaView>;
}

const styles = StyleSheet.create({ content: { flexGrow: 1, justifyContent: "center", padding: 22, gap: 19 }, eyebrow: { fontSize: 10, fontWeight: "900", letterSpacing: 1.8, marginTop: 10 }, title: { fontSize: 32, lineHeight: 39, fontWeight: "900", marginTop: 10 }, copy: { fontSize: 13, lineHeight: 20, marginTop: 8 }, cardLabel: { fontSize: 9, fontWeight: "900", letterSpacing: 1.6 }, cardTitle: { fontSize: 21, fontWeight: "900", marginTop: 8 }, cardCopy: { fontSize: 12, lineHeight: 18, marginTop: 6, marginBottom: 17 }, back: { alignItems: "center", padding: 14 }, backText: { fontSize: 12, fontWeight: "800" } });
