import {
  PremiumBackdrop,
  PremiumBrand,
  PremiumButton,
  PremiumCard,
  Reveal,
} from "@/components/premium-ui";
import { useAppTheme } from "@/providers/app-theme-provider";
import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function VendorLoginScreen() {
  const { colors } = useAppTheme();
  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
      <PremiumBackdrop>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Reveal>
            <PremiumBrand partner="PARTNER WORKSPACE" />
          </Reveal>
          <Reveal delay={90}>
            <Text style={[styles.eyebrow, { color: colors.primary }]}>
              <Text style={styles.line}>— </Text>FOR LAUNDRY PARTNERS
            </Text>
            <Text style={[styles.title, { color: colors.text }]}>
              Run your shop with clarity.
            </Text>
            <Text style={[styles.description, { color: colors.textSecondary }]}>
              Manage bookings, services and your daily operations in one calm
              workspace.
            </Text>
          </Reveal>
          <Reveal delay={170}>
            <PremiumCard style={styles.card}>
              <Text style={[styles.cardEyebrow, { color: colors.gold }]}>
                LUMINA PARTNER PORTAL
              </Text>
              <Text style={[styles.cardTitle, { color: colors.text }]}>
                Everything in one place.
              </Text>
              <Text style={[styles.cardCopy, { color: colors.textSecondary }]}>
                Live orders, driver handoffs and service operations—kept
                beautifully simple.
              </Text>
              <PremiumButton
                onPress={() =>
                  router.push({
                    pathname: "/role-login",
                    params: { role: "vendor" },
                  })
                }
              >
                Continue to vendor sign in
              </PremiumButton>
              <PremiumButton
                variant="secondary"
                onPress={() => router.push("/vendor-register")}
                style={styles.secondary}
              >
                Register your shop
              </PremiumButton>
              <Pressable
                style={styles.linkButton}
                onPress={() => router.push("/vendor-forgot-password")}
              >
                <Text style={[styles.link, { color: colors.primary }]}>
                  Forgot password?
                </Text>
              </Pressable>
            </PremiumCard>
          </Reveal>
          <Reveal delay={250}>
            <Pressable style={styles.back} onPress={() => router.back()}>
              <Text style={[styles.backText, { color: colors.primary }]}>
                ← Back to Lumina
              </Text>
            </Pressable>
          </Reveal>
        </ScrollView>
      </PremiumBackdrop>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, justifyContent: "center", padding: 22, gap: 18 },
  eyebrow: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.7,
    marginTop: 12,
  },
  line: { color: "#EDCB88" },
  title: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: "900",
    letterSpacing: -0.8,
    marginTop: 11,
    maxWidth: 340,
  },
  description: { fontSize: 14, lineHeight: 21, marginTop: 10, maxWidth: 335 },
  card: { marginTop: 5 },
  cardEyebrow: { fontSize: 9, fontWeight: "900", letterSpacing: 1.6 },
  cardTitle: { fontSize: 21, fontWeight: "900", marginTop: 8 },
  cardCopy: { fontSize: 12, lineHeight: 18, marginTop: 6, marginBottom: 17 },
  secondary: { marginTop: 10 },
  linkButton: { alignItems: "center", paddingVertical: 13 },
  link: { fontSize: 12, fontWeight: "900" },
  back: { alignItems: "center", padding: 9 },
  backText: { fontSize: 12, fontWeight: "800" },
});
