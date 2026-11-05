import React, { useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";
import { PremiumBackdrop } from "@/components/premium-ui";
import { registerVendor } from "@/lib/auth";

export default function VendorRegisterScreen() {
  const [owner, setOwner] = useState("");
  const [shop, setShop] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (
      !owner.trim() ||
      !shop.trim() ||
      !/^[6-9]\d{9}$/.test(phone) ||
      !/^\S+@\S+\.\S+$/.test(email.trim()) ||
      !address.trim() ||
      !city.trim() ||
      password.length < 8
    ) {
      Alert.alert(
        "Check your details",
        "Enter the owner's name, shop name, valid 10-digit Indian mobile, valid email, complete address, city and a password with at least 8 characters.",
      );
      return;
    }

    setBusy(true);
    try {
      await registerVendor({
        ownerName: owner,
        shopName: shop,
        phone,
        email,
        address: `${address.trim()}, ${city.trim()}`,
        password,
      });
      Alert.alert(
        "Application submitted",
        "Your partner application is with Lumina for review. You can sign in to the vendor workspace after your account is approved.",
        [{ text: "OK", onPress: () => router.replace("/vendor-login") }],
      );
    } catch (error) {
      Alert.alert(
        "Could not submit application",
        error instanceof Error ? error.message : "Please try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  const field = (
    label: string,
    value: string,
    setValue: (value: string) => void,
    placeholder: string,
    options: {
      phone?: boolean;
      email?: boolean;
      secure?: boolean;
      multiline?: boolean;
    } = {},
  ) => (
    <View key={label} style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={setValue}
        placeholder={placeholder}
        placeholderTextColor="#4B5B50"
        keyboardType={
          options.phone ? "phone-pad" : options.email ? "email-address" : "default"
        }
        autoCapitalize={options.email ? "none" : "words"}
        autoCorrect={!options.email}
        secureTextEntry={options.secure}
        maxLength={options.phone ? 10 : undefined}
        multiline={options.multiline}
        textAlignVertical={options.multiline ? "top" : "center"}
        style={[styles.input, options.multiline && styles.multiline]}
      />
    </View>
  );

  return (
    <PremiumBackdrop>
      <ScrollView
        style={styles.page}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.eyebrow}>JOIN THE LUMINA NETWORK</Text>
        <Text style={styles.title}>Apply as a partner</Text>
        <Text style={styles.description}>
          Submit your shop details for review. Your vendor workspace will be
          available after Lumina approves your application.
        </Text>
        <View style={styles.card}>
          {field("Owner name", owner, setOwner, "Full name")}
          {field("Shop name", shop, setShop, "Laundry shop name")}
          {field("Phone number", phone, (value) => setPhone(value.replace(/\D/g, "")), "10-digit mobile number", { phone: true })}
          {field("Business email", email, setEmail, "shop@example.com", { email: true })}
          {field("Shop address", address, setAddress, "House, street and area", { multiline: true })}
          {field("City", city, setCity, "Your city")}
          {field("Password", password, setPassword, "At least 8 characters", { secure: true })}
          <Pressable
            accessibilityRole="button"
            disabled={busy}
            style={[styles.primary, busy && styles.disabled]}
            onPress={() => void submit()}
          >
            <Text style={styles.primaryText}>
              {busy ? "Submitting…" : "Submit partner application"}
            </Text>
          </Pressable>
          <Text style={styles.note}>
            Your password is not saved on this device. A pending application
            cannot access the vendor workspace.
          </Text>
        </View>
        <Pressable style={styles.login} onPress={() => router.push("/vendor-login")}>
          <Text style={styles.link}>Already approved? Vendor sign in</Text>
        </Pressable>
      </ScrollView>
    </PremiumBackdrop>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#F7F5F0" },
  content: { padding: 20, paddingBottom: 40, gap: 12 },
  backText: { color: "#214738", fontSize: 13, fontWeight: "700", paddingVertical: 10 },
  eyebrow: { color: "#214738", fontSize: 10, fontWeight: "900", letterSpacing: 1.8, marginTop: 8 },
  title: { color: "#214738", fontSize: 30, fontWeight: "900" },
  description: { color: "#4B5B50", fontSize: 14, lineHeight: 21 },
  card: { backgroundColor: "#FFFDFA", borderRadius: 18, borderWidth: 1, borderColor: "#CDD8CE", padding: 17, gap: 12 },
  field: { gap: 6 },
  label: { color: "#214738", fontSize: 12, fontWeight: "800" },
  input: { backgroundColor: "#FFFDFA", borderWidth: 1, borderColor: "#CDD8CE", borderRadius: 11, padding: 13, color: "#214738" },
  multiline: { minHeight: 76 },
  primary: { backgroundColor: "#214738", borderRadius: 12, padding: 15, alignItems: "center" },
  disabled: { opacity: 0.55 },
  primaryText: { color: "#FFFDFA", fontWeight: "900" },
  note: { color: "#4B5B50", fontSize: 11, lineHeight: 16 },
  login: { alignItems: "center", padding: 12 },
  link: { color: "#214738", fontWeight: "800" },
});
