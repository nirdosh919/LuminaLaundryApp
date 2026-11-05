import React, { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { dashboardForRole, signIn, type AccountRole } from "@/lib/auth";
import { PremiumBackdrop, PremiumBrand, PremiumButton, PremiumCard, Reveal } from "@/components/premium-ui";
import { useAppTheme } from "@/providers/app-theme-provider";
import { useRoleAccess } from "@/providers/role-access-provider";

export default function RoleLoginScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { activateRole } = useRoleAccess();
  const params = useLocalSearchParams<{ role?: string }>();
  const role = params.role === "admin" || params.role === "vendor" || params.role === "driver" ? params.role : "customer";
  const [identity, setIdentity] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const login = async () => {
    if (!identity.trim() || !password.trim()) { Alert.alert("Missing details", role === "driver" ? "Enter your phone number and password." : "Enter your email and password."); return; }
    setBusy(true);
    try { const account = await signIn(role as AccountRole, identity, password); activateRole(account.role); router.replace(dashboardForRole(account.role) as never); }
    catch (error) { Alert.alert("Could not sign in", error instanceof Error ? error.message : "Please try again."); }
    finally { setBusy(false); }
  };

  const chooseRole = (next: string) => router.replace({ pathname: "/role-login", params: { role: next } } as never);
  const label = role === "driver" ? "Phone number" : "Email";

  return <PremiumBackdrop><ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
    <Reveal><PremiumBrand partner="SECURE WORKSPACE ACCESS" /></Reveal>
    <Reveal delay={90}><Text style={[styles.eyebrow, { color: colors.primary }]}>WELCOME BACK</Text><Text style={[styles.title, { color: colors.text }]}>Sign in to your workspace.</Text><Text style={[styles.subtitle, { color: colors.textSecondary }]}>Your Lumina operations, ready when you are.</Text></Reveal>
    <Reveal delay={170}><PremiumCard style={styles.card}><Text style={[styles.label, { color: colors.text }]}>ACCOUNT TYPE</Text><View style={styles.roles}>{(["customer", "admin", "vendor", "driver"] as const).map(item => <Pressable key={item} onPress={() => chooseRole(item)} style={[styles.role, { backgroundColor: colors.input, borderColor: colors.border }, role === item && { backgroundColor: colors.accentSoft, borderColor: colors.primary }]}><Text style={[styles.roleText, { color: role === item ? colors.primaryStrong : colors.textSecondary }]}>{item[0].toUpperCase() + item.slice(1)}</Text></Pressable>)}</View><Text style={[styles.label, { color: colors.text }]}>{label}</Text><TextInput value={identity} onChangeText={setIdentity} autoCapitalize="none" keyboardType={role === "driver" ? "phone-pad" : "email-address"} placeholder={role === "driver" ? "Your registered phone number" : "you@example.com"} placeholderTextColor={colors.textSecondary} style={[styles.input, { backgroundColor: colors.input, borderColor: colors.border, color: colors.text }]} /><Text style={[styles.label, { color: colors.text }]}>Password</Text><TextInput value={password} onChangeText={setPassword} secureTextEntry placeholder="Enter password" placeholderTextColor={colors.textSecondary} style={[styles.input, { backgroundColor: colors.input, borderColor: colors.border, color: colors.text }]} /><PremiumButton disabled={busy} onPress={() => void login()}>{busy ? "Signing in…" : `Continue as ${role}`}</PremiumButton><Pressable accessibilityRole="button" onPress={() => router.replace("/register" as never)} style={styles.back}><Text style={[styles.backText, { color: colors.primary }]}>Create account</Text></Pressable><Text style={[styles.note, { color: colors.textSecondary }]}>Sign-in is verified by Lumina. Only active accounts can open this workspace.</Text></PremiumCard></Reveal>
  </ScrollView></PremiumBackdrop>;
}

const styles = StyleSheet.create({ content: { flexGrow: 1, justifyContent: "center", padding: 22, gap: 18 }, eyebrow: { fontSize: 10, fontWeight: "900", letterSpacing: 1.8, marginTop: 10 }, title: { fontSize: 32, lineHeight: 39, fontWeight: "900", marginTop: 9 }, subtitle: { fontSize: 13, lineHeight: 20, marginTop: 7 }, card: { gap: 12 }, label: { fontSize: 11, fontWeight: "900", letterSpacing: 0.7 }, roles: { flexDirection: "row", gap: 7, marginBottom: 3 }, role: { flex: 1, borderRadius: 11, paddingVertical: 11, alignItems: "center", borderWidth: 1 }, roleText: { fontSize: 11, fontWeight: "800" }, input: { borderWidth: 1, borderRadius: 13, paddingHorizontal: 14, paddingVertical: 14, fontSize: 13 }, back: { alignItems: "center", paddingVertical: 5 }, backText: { fontSize: 12, fontWeight: "800" }, note: { fontSize: 10, lineHeight: 15, textAlign: "center" } });
