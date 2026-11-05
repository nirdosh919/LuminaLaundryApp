
import { router, useLocalSearchParams } from "expo-router";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useThemedStyles } from "@/hooks/use-themed-styles";

export default function VerifyOtpScreen() {
  const styles = useThemedStyles(baseStyles);
  const { phone } = useLocalSearchParams<{ phone?: string }>();
  const number = Array.isArray(phone) ? phone[0] : phone ?? "";

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Pressable onPress={() => router.back()} accessibilityRole="button">
          <Text style={styles.back}>←  Back</Text>
        </Pressable>
        <View style={styles.card}>
          <Text style={styles.eyebrow}>OTP SIGN-IN UNAVAILABLE</Text>
          <Text style={styles.title}>OTP verification unavailable</Text>
          <Text style={styles.description}>
            Number: +91 {number}. The Laravel API has no OTP delivery or verification endpoint.
          </Text>
          <Pressable accessibilityRole="button" style={styles.button} onPress={() => router.replace("/login")}>
            <Text style={styles.buttonText}>Sign in with email and password</Text>
          </Pressable>
          <View style={styles.notice}>
            <Text style={styles.noticeTitle}>No real OTP or resend service</Text>
            <Text style={styles.noticeText}>
              OTP delivery, expiry, resend and verification are unavailable
              until an authentication provider is connected.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const baseStyles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F7F5F0" },
  content: { flexGrow: 1, justifyContent: "center", padding: 20 },
  back: { color: "#2F674A", fontSize: 13, fontWeight: "700", paddingVertical: 16 },
  card: { backgroundColor: "#FFFDFA", borderColor: "#CDD8CE", borderWidth: 1, borderRadius: 20, padding: 21 },
  eyebrow: { color: "#2F674A", fontSize: 10, fontWeight: "900", letterSpacing: 1.8 },
  title: { color: "#214738", fontSize: 27, fontWeight: "800", marginTop: 10 },
  description: { color: "#4B5B50", fontSize: 13, lineHeight: 20, marginTop: 8 },
  button: { minHeight: 48, borderRadius: 12, backgroundColor: "#2F674A", alignItems: "center", justifyContent: "center", marginTop: 18 },
  buttonText: { color: "#FFFDFA", fontSize: 13, fontWeight: "800" },
  notice: { backgroundColor: "#E3EEE6", borderRadius: 12, padding: 13, marginTop: 18 },
  noticeTitle: { color: "#214738", fontSize: 11, fontWeight: "800" },
  noticeText: { color: "#4B5B50", fontSize: 11, lineHeight: 16, marginTop: 4 },
});

