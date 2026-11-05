import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppTheme } from "@/providers/app-theme-provider";

const options = [
  { icon: "✦", title: "Offers & promo codes", detail: "View offers available in this preview", route: "/promo-codes" },
  { icon: "◷", title: "Laundry plans", detail: "Explore subscription options", route: "/subscriptions" },
  { icon: "♧", title: "Notifications", detail: "Review saved notification examples", route: "/notifications" },
];

export default function LoyaltyScreen() {
  const { colors } = useAppTheme();
  const styles = createStyles(colors);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText}>‹  Back</Text>
        </Pressable>
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>LUMINA CARE</Text>
          <Text style={styles.title}>Rewards, thoughtfully.</Text>
          <Text style={styles.copy}>A home for offers, laundry plans and future loyalty benefits.</Text>
          <View style={styles.badge}><Text style={styles.badgeText}>PREVIEW MODE</Text></View>
        </View>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Your rewards balance</Text>
          <Text style={styles.balance}>Not connected</Text>
          <Text style={styles.description}>Points and referral rewards need a verified account service. No balance or referral credit is being calculated in this preview.</Text>
        </View>
        {options.map((option) => (
          <Pressable key={option.title} accessibilityRole="button" onPress={() => router.push(option.route as never)} style={styles.row}>
            <View style={styles.icon}><Text style={styles.iconText}>{option.icon}</Text></View>
            <View style={styles.rowCopy}>
              <Text style={styles.rowTitle}>{option.title}</Text>
              <Text style={styles.description}>{option.detail}</Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </Pressable>
        ))}
        <Text style={styles.footnote}>Offers and plans shown in this app are previews. Referral sharing and reward redemption are not active.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(colors: ReturnType<typeof useAppTheme>["colors"]) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    content: { padding: 20, paddingBottom: 36, gap: 13 },
    back: { alignSelf: "flex-start", paddingVertical: 7 },
    backText: { color: colors.primaryStrong, fontSize: 14, fontWeight: "800" },
    hero: { backgroundColor: colors.primaryStrong, borderRadius: 22, padding: 22, gap: 9 },
    eyebrow: { color: colors.gold, fontSize: 10, fontWeight: "900", letterSpacing: 1.5 },
    title: { color: "#FFFDFA", fontFamily: "serif", fontSize: 27, fontWeight: "700" },
    copy: { color: "#E3EEE6", fontSize: 13, lineHeight: 19 },
    badge: { alignSelf: "flex-start", backgroundColor: colors.gold, borderRadius: 14, paddingHorizontal: 10, paddingVertical: 6, marginTop: 2 },
    badgeText: { color: colors.text, fontSize: 9, fontWeight: "900", letterSpacing: 1 },
    card: { backgroundColor: colors.backgroundElement, borderWidth: 1, borderColor: colors.border, borderRadius: 17, padding: 17, gap: 7 },
    sectionTitle: { color: colors.text, fontSize: 15, fontWeight: "800" },
    balance: { color: colors.primaryStrong, fontFamily: "serif", fontSize: 22, fontWeight: "700" },
    description: { color: colors.textSecondary, fontSize: 11, lineHeight: 17 },
    row: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: colors.backgroundElement, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 13 },
    icon: { width: 42, height: 42, borderRadius: 13, backgroundColor: colors.accentSoft, alignItems: "center", justifyContent: "center" },
    iconText: { color: colors.primaryStrong, fontSize: 20, fontWeight: "800" },
    rowCopy: { flex: 1, gap: 4 },
    rowTitle: { color: colors.text, fontSize: 12, fontWeight: "800" },
    arrow: { color: colors.primaryStrong, fontSize: 24 },
    footnote: { color: colors.textSecondary, fontSize: 10, lineHeight: 16, textAlign: "center", paddingHorizontal: 10, marginTop: 5 },
  });
}
