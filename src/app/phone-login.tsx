import { router } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useThemedStyles } from "@/hooks/use-themed-styles";

export default function PhoneLoginScreen() {
  const styles = useThemedStyles(baseStyles);
  const [phone, setPhone] = useState("");

  const continueWithPhone = () => {
    if (!/^[6-9]\d{9}$/.test(phone)) {
      Alert.alert("Check your mobile number", "Enter a valid 10-digit Indian mobile number.");
      return;
    }
    router.push({ pathname: "/verify-otp", params: { phone } });
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Pressable onPress={() => router.back()} accessibilityRole="button">
          <Text style={styles.back}>←  Back</Text>
        </Pressable>
        <View style={styles.card}>
          <Text style={styles.eyebrow}>MOBILE SIGN-IN</Text>
          <Text style={styles.title}>Your number, please.</Text>
          <Text style={styles.description}>
            Continue with your mobile number. This preview will not send an SMS
            or verify a real account.
          </Text>
          <Text style={styles.label}>Mobile number</Text>
          <View style={styles.phoneField}>
            <Text style={styles.countryCode}>+91</Text>
            <TextInput
              accessibilityLabel="10-digit mobile number"
              value={phone}
              onChangeText={(value) => setPhone(value.replace(/\D/g, "").slice(0, 10))}
              keyboardType="phone-pad"
              maxLength={10}
              placeholder="00000 00000"
              placeholderTextColor="#8A98A2"
              style={styles.input}
            />
          </View>
          <Pressable
            accessibilityRole="button"
            style={styles.button}
            onPress={continueWithPhone}
          >
            <Text style={styles.buttonText}>Continue</Text>
          </Pressable>
          <View style={styles.notice}>
            <Text style={styles.noticeTitle}>Development-only mock</Text>
            <Text style={styles.noticeText}>
              The next step is a local UI preview only. No OTP will be sent.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const baseStyles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F7F9FC" },
  content: { flexGrow: 1, justifyContent: "center", padding: 20 },
  back: { color: "#168C91", fontSize: 13, fontWeight: "700", paddingVertical: 16 },
  card: { backgroundColor: "#FFFFFF", borderColor: "#E2E9EE", borderWidth: 1, borderRadius: 20, padding: 21 },
  eyebrow: { color: "#168C91", fontSize: 10, fontWeight: "900", letterSpacing: 1.8 },
  title: { color: "#123B50", fontSize: 28, fontWeight: "800", marginTop: 10 },
  description: { color: "#6B7C87", fontSize: 13, lineHeight: 20, marginTop: 8 },
  label: { color: "#123B50", fontSize: 12, fontWeight: "800", marginTop: 25, marginBottom: 8 },
  phoneField: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#E2E9EE", borderRadius: 12, paddingHorizontal: 13, backgroundColor: "#F7F9FC" },
  countryCode: { color: "#123B50", fontSize: 14, fontWeight: "700", paddingRight: 12, borderRightWidth: 1, borderRightColor: "#E2E9EE" },
  input: { flex: 1, paddingHorizontal: 12, paddingVertical: 14, color: "#123B50", fontSize: 15 },
  button: { minHeight: 48, borderRadius: 12, backgroundColor: "#168C91", alignItems: "center", justifyContent: "center", marginTop: 18 },
  buttonText: { color: "#FFFFFF", fontSize: 13, fontWeight: "800" },
  notice: { backgroundColor: "#E5F6F4", borderRadius: 12, padding: 13, marginTop: 18 },
  noticeTitle: { color: "#123B50", fontSize: 11, fontWeight: "800" },
  noticeText: { color: "#6B7C87", fontSize: 11, lineHeight: 16, marginTop: 4 },
});
