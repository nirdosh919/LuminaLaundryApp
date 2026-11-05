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
import { requestPasswordReset } from "@/lib/laundry-api";

export default function VendorForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  const requestReset = async () => {
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      Alert.alert("Check your email", "Enter the email for your vendor account.");
      return;
    }
    setBusy(true);
    try {
      const message = await requestPasswordReset(email.trim(), "vendor");
      Alert.alert("Check your email", message);
    } catch (error) {
      Alert.alert(
        "Could not request reset",
        error instanceof Error ? error.message : "Please try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <PremiumBackdrop><ScrollView
      style={s.page}
      contentContainerStyle={s.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={s.eyebrow}>VENDOR ACCOUNT</Text>
      <Text style={s.title}>Reset password</Text>
      <Text style={s.description}>
        Enter your shop account email to request a password reset.
      </Text>
      <View style={s.card}>
        <Text style={s.label}>Business email</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="shop@example.com"
          placeholderTextColor="#4B5B50"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          style={s.input}
          editable={!busy}
        />
        <Pressable
          disabled={busy}
          style={[s.primary, busy && s.disabled]}
          onPress={requestReset}
        >
          <Text style={s.primaryText}>
            {busy ? "Requesting reset link…" : "Request reset link"}
          </Text>
        </Pressable>
        <Text style={s.note}>
          If a vendor account exists for that email, a password reset link will be sent.
        </Text>
      </View>
      <Pressable
        style={s.back}
        onPress={() => router.push("/vendor-login")}
      >
        <Text style={s.link}>Back to vendor sign in</Text>
      </Pressable>
    </ScrollView></PremiumBackdrop>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#F7F5F0" },
  content: { flexGrow: 1, justifyContent: "center", padding: 20, gap: 12 },
  eyebrow: {
    color: "#214738",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.8,
  },
  title: { color: "#214738", fontSize: 30, fontWeight: "900" },
  description: { color: "#4B5B50", fontSize: 14, lineHeight: 21 },
  card: {
    backgroundColor: "#FFFDFA",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#CDD8CE",
    padding: 17,
    gap: 10,
  },
  label: { color: "#214738", fontSize: 12, fontWeight: "800" },
  input: {
    backgroundColor: "#FFFDFA",
    borderWidth: 1,
    borderColor: "#CDD8CE",
    borderRadius: 11,
    padding: 13,
    color: "#214738",
  },
  primary: {
    backgroundColor: "#214738",
    borderRadius: 12,
    padding: 15,
    alignItems: "center",
    marginTop: 4,
  },
  disabled: { opacity: 0.6 },
  primaryText: { color: "#FFFDFA", fontWeight: "900" },
  note: { color: "#4B5B50", fontSize: 11, lineHeight: 16 },
  link: { color: "#214738", fontWeight: "700" },
  back: { alignItems: "center", padding: 12 },
});
