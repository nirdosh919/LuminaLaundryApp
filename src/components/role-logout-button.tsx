import React, { useState } from "react";
import { Alert, Pressable, StyleSheet, Text } from "react-native";
import { router } from "expo-router";
import { signOut } from "@/lib/auth";
import { useRoleAccess } from "@/providers/role-access-provider";
import { useAppTheme } from "@/providers/app-theme-provider";

export function RoleLogoutButton({ floating = false }: { floating?: boolean }) {
  const { colors } = useAppTheme();
  const { clearRole } = useRoleAccess();
  const [busy, setBusy] = useState(false);
  const logout = async () => {
    if (busy) return;
    setBusy(true);
    try { await signOut(); }
    catch (error) { Alert.alert("Signed out on this device", error instanceof Error ? error.message : "The server could not end the session."); }
    finally { clearRole(); router.replace("/role-login"); setBusy(false); }
  };
  return <Pressable accessibilityRole="button" disabled={busy} onPress={() => void logout()} style={[styles.button, floating && styles.floating, { borderColor: colors.border, backgroundColor: colors.backgroundElement }]}><Text style={[styles.label, { color: colors.primary }]}>{busy ? "Signing out…" : "Sign out"}</Text></Pressable>;
}

const styles = StyleSheet.create({ button: { borderWidth: 1, borderRadius: 11, paddingVertical: 9, paddingHorizontal: 13 }, floating: { position: "absolute", zIndex: 10, top: 52, right: 16 }, label: { fontSize: 11, fontWeight: "900" } });
