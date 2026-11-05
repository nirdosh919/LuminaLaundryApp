import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BrandColors } from "@/constants/theme";
import { useThemedStyles } from "@/hooks/use-themed-styles";
import { LuminaLogo } from "@/components/brand-ui";

const slides = [
  {
    step: "01",
    title: "Convenient laundry pickup",
    description: "Choose the care you need and a pickup time that works for you.",
    icon: "⌂",
  },
  {
    step: "02",
    title: "Professional fabric care",
    description: "Explore laundry, dry cleaning, ironing and specialist care.",
    icon: "✧",
  },
  {
    step: "03",
    title: "Stay on top of your order",
    description: "Keep your bookings together and review their details in one place.",
    icon: "◷",
  },
];

const languages = ["English", "हिन्दी", "தமிழ்", "తెలుగు"] as const;

export default function WelcomeScreen() {
  const styles = useThemedStyles(baseStyles);
  const [index, setIndex] = useState(0);
  const [language, setLanguage] = useState<(typeof languages)[number]>("English");
  const [busy, setBusy] = useState(false);
  const slide = slides[index];

  const finish = async () => {
    setBusy(true);
    try {
      await AsyncStorage.setItem("lumina_onboarding_complete", "true");
      await AsyncStorage.setItem("lumina_preferred_language", language);
      router.replace("/(tabs)" as never);
    } catch (error) {
      Alert.alert(
        "Could not save your preference",
        error instanceof Error ? error.message : "Please try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        <View style={styles.topRow}>
          <LuminaLogo height={32} />
          <Pressable
            accessibilityRole="button"
            disabled={busy}
            onPress={() => void finish()}
            hitSlop={12}
          >
            <Text style={styles.skip}>Skip</Text>
          </Pressable>
        </View>
        <View style={styles.languagePanel}>
          <Text style={styles.languageLabel}>APP LANGUAGE</Text>
          <View style={styles.languageChoices}>
            {languages.map((item) => (
              <Pressable
                key={item}
                accessibilityRole="radio"
                accessibilityState={{ checked: language === item }}
                onPress={() => setLanguage(item)}
                style={[styles.languageChoice, language === item && styles.languageSelected]}
              >
                <Text style={[styles.languageText, language === item && styles.languageSelectedText]}>{item}</Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.languageHint}>Saved on this device. Other app screens are currently in English.</Text>
        </View>
        <View style={styles.illustration}>
          <View style={styles.orbit}>
            <Text style={styles.icon}>{slide.icon}</Text>
          </View>
          <Text style={styles.step}>{slide.step}</Text>
        </View>
        <View style={styles.copy}>
          <Text style={styles.eyebrow}>LAUNDRY & CARE, MADE SIMPLE</Text>
          <Text style={styles.title}>{slide.title}</Text>
          <Text style={styles.description}>{slide.description}</Text>
        </View>
        <View style={styles.footer}>
          <View style={styles.dots}>
            {slides.map((item, dotIndex) => (
              <View
                key={item.step}
                style={[styles.dot, index === dotIndex && styles.activeDot]}
              />
            ))}
          </View>
          <Pressable
            accessibilityRole="button"
            disabled={busy}
            style={styles.button}
            onPress={() => {
              if (index === slides.length - 1) void finish();
              else setIndex((current) => current + 1);
            }}
          >
            <Text style={styles.buttonText}>
              {busy ? "Saving…" : index === slides.length - 1 ? "Get started" : "Continue"}
            </Text>
          </Pressable>
          <Text style={styles.demoNote}>Application preview · Core actions run locally on this device</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const baseStyles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BrandColors.cream },
  content: { flex: 1, padding: 22, justifyContent: "space-between" },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  brand: { color: BrandColors.forest, fontSize: 19, fontWeight: "900", letterSpacing: 3 },
  skip: { color: BrandColors.green, fontSize: 13, fontWeight: "700", padding: 8 },
  languagePanel: { marginTop: 12 },
  languageLabel: { color: BrandColors.muted, fontSize: 9, fontWeight: "800", letterSpacing: 1.2, marginBottom: 8 },
  languageChoices: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  languageChoice: { borderWidth: 1, borderColor: "#CDD8CE", borderRadius: 16, paddingHorizontal: 10, paddingVertical: 7, backgroundColor: "#FFFDFA" },
  languageSelected: { backgroundColor: BrandColors.forest, borderColor: BrandColors.forest },
  languageText: { color: BrandColors.forest, fontSize: 10, fontWeight: "700" },
  languageSelectedText: { color: "#FFFDFA" },
  languageHint: { color: BrandColors.muted, fontSize: 9, marginTop: 6 },
  illustration: { flex: 1, minHeight: 230, alignItems: "center", justifyContent: "center" },
  orbit: { width: 188, height: 188, borderRadius: 94, backgroundColor: BrandColors.mint, alignItems: "center", justifyContent: "center" },
  icon: { color: BrandColors.forest, fontSize: 74, fontWeight: "700" },
  step: { position: "absolute", bottom: "20%", right: "20%", color: BrandColors.green, fontSize: 12, fontWeight: "900", letterSpacing: 1.5 },
  copy: { alignItems: "center", paddingHorizontal: 10, paddingBottom: 22 },
  eyebrow: { color: BrandColors.green, fontSize: 9, fontWeight: "900", letterSpacing: 1.5, textAlign: "center" },
  title: { color: BrandColors.ink, fontSize: 29, lineHeight: 36, fontWeight: "800", textAlign: "center", marginTop: 12 },
  description: { color: BrandColors.muted, fontSize: 14, lineHeight: 22, textAlign: "center", marginTop: 9, maxWidth: 330 },
  footer: { alignItems: "center", paddingBottom: 8 },
  dots: { flexDirection: "row", gap: 8, marginBottom: 18 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#CDD8CE" },
  activeDot: { width: 22, backgroundColor: BrandColors.forest },
  button: { minHeight: 50, width: "100%", borderRadius: 14, backgroundColor: BrandColors.forest, alignItems: "center", justifyContent: "center" },
  buttonText: { color: "#FFFDFA", fontSize: 14, fontWeight: "800" },
  demoNote: { color: BrandColors.muted, fontSize: 9, textAlign: "center", marginTop: 12 },
});
