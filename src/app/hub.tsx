import React from "react";
import { ScrollView, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { LuminaLogo } from "@/components/brand-ui";

const GREEN = "#3E755F";
const items = [
  ["My Orders", "/orders"],
  ["Book a Pickup", "/booking"],
  ["Saved Addresses", "/addresses"],
  ["Favorites", "/favorites"],
  ["Notifications", "/notifications"],
  ["Help & Support", "/support"],
] as const;

export default function MoreScreen() {
  const router = useRouter();
  return (
    <ScrollView style={s.page} contentContainerStyle={s.content}>
      <LuminaLogo height={36} />
      <Text style={s.title}>More</Text>
      <Text style={s.subtitle}>Manage your laundry experience.</Text>
      <View style={s.card}>
        {items.map(([label, path]) => (
          <Pressable key={path} style={s.item} onPress={() => router.push(path as never)}>
            <Text style={s.itemText}>{label}</Text>
            <Text style={s.arrow}>›</Text>
          </Pressable>
        ))}
      </View>
      <Pressable style={s.teamButton} onPress={() => router.push("/role-login" as never)}>
        <Text style={s.teamText}>Team Login · Admin / Vendor / Driver</Text>
      </Pressable>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#F7F5F0" },
  content: { padding: 20, paddingTop: 28, gap: 12 },
  eyebrow: { color: GREEN, fontSize: 11, fontWeight: "900", letterSpacing: 2 },
  title: { color: "#1E2B24", fontSize: 30, fontWeight: "900" },
  subtitle: { color: "#6F7D75", fontSize: 14, marginBottom: 8 },
  card: { backgroundColor: "#FFFFFF", borderRadius: 18, paddingHorizontal: 16, borderWidth: 1, borderColor: "#DDE5DF" },
  item: { minHeight: 52, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: "#E9F1ED" },
  itemText: { color: "#1E2B24", fontSize: 15, fontWeight: "600" },
  arrow: { color: GREEN, fontSize: 24 },
  teamButton: { backgroundColor: GREEN, borderRadius: 14, padding: 16, alignItems: "center", marginTop: 6 },
  teamText: { color: "#FFFFFF", fontWeight: "800", textAlign: "center" },
});
