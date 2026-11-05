import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  getAppThemeColors,
  type ThemeAccent,
  type ThemeFontSize,
  type ThemeMode,
  type ThemePreferences,
} from "@/constants/theme";
import { useAppTheme } from "@/providers/app-theme-provider";

const modes: { value: ThemeMode; label: string; caption: string }[] = [
  { value: "system", label: "System", caption: "Follow your device" },
  { value: "light", label: "Light", caption: "Cream and soft surfaces" },
  { value: "dark", label: "Dark", caption: "Forest tones after dark" },
];

const accents: { value: ThemeAccent; label: string; color: string }[] = [
  { value: "brand", label: "Forest & Gold", color: "#214738" },
  { value: "aqua", label: "Aqua Teal", color: "#168C91" },
  { value: "blue", label: "Blue", color: "#2563EB" },
  { value: "purple", label: "Purple", color: "#7C3AED" },
  { value: "green", label: "Green", color: "#22824A" },
];

const fontSizes: { value: ThemeFontSize; label: string }[] = [
  { value: "small", label: "Small" },
  { value: "standard", label: "Standard" },
  { value: "large", label: "Large" },
];

const scales: Record<ThemeFontSize, number> = {
  small: 0.9,
  standard: 1,
  large: 1.15,
};

export default function AppearanceSettings() {
  const { colors, effectiveMode, isReady, preferences, updatePreferences } =
    useAppTheme();
  const [draft, setDraft] = useState<ThemePreferences>(preferences);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Sync the draft after saved preferences finish loading.
    if (isReady) setDraft(preferences);
  }, [isReady, preferences]);

  const previewMode = draft.mode === "system" ? effectiveMode : draft.mode;
  const preview = getAppThemeColors(previewMode, draft.accent);
  const changed = JSON.stringify(draft) !== JSON.stringify(preferences);

  const apply = async () => {
    setSaving(true);
    try {
      await updatePreferences(draft);
    } catch (error) {
      Alert.alert(
        "Could not save appearance",
        error instanceof Error ? error.message : "Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          accessibilityRole="button"
          onPress={() => router.back()}
          hitSlop={10}
          style={styles.back}
        >
          <Text style={[styles.backText, { color: colors.primary }]}>←  Back</Text>
        </Pressable>
        <Text style={[styles.eyebrow, { color: colors.primary }]}>
          PERSONALIZE LUMINA
        </Text>
        <Text style={[styles.title, { color: colors.text }]}>Appearance</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          The forest-green, cream and gold look is the default. Preview other
          options before applying them.
        </Text>

        <View
          style={[
            styles.previewCard,
            {
              backgroundColor: preview.backgroundElement,
              borderColor: preview.border,
            },
          ]}
        >
          <Text style={[styles.previewLabel, { color: preview.textSecondary }]}>
            LIVE PREVIEW
          </Text>
          <Text
            style={[
              styles.previewTitle,
              { color: preview.text, fontSize: 20 * scales[draft.fontSize] },
            ]}
          >
            Fresh care, your way
          </Text>
          <View
            style={[
              styles.previewSurface,
              { backgroundColor: preview.accentSoft },
            ]}
          >
            <Text
              style={[
                styles.previewBody,
                {
                  color: preview.textSecondary,
                  fontSize: 11 * scales[draft.fontSize],
                },
              ]}
            >
              A quick preview of your chosen colors and text size.
            </Text>
          </View>
          <View
            style={[
              styles.previewButton,
              { backgroundColor: preview.primary },
            ]}
          >
            <Text
              style={[
                styles.previewButtonText,
                { color: preview.onPrimary },
              ]}
            >
              Explore services
            </Text>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Color mode
        </Text>
        <View style={styles.modeOptions}>
          {modes.map((mode) => {
            const selected = draft.mode === mode.value;
            return (
              <Pressable
                key={mode.value}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected }}
                onPress={() =>
                  setDraft((current) => ({ ...current, mode: mode.value }))
                }
                style={[
                  styles.modeCard,
                  {
                    borderColor: selected ? colors.primary : colors.border,
                    backgroundColor: selected
                      ? colors.backgroundSelected
                      : colors.backgroundElement,
                  },
                ]}
              >
                <Text style={[styles.optionTitle, { color: colors.text }]}>
                  {mode.label}
                </Text>
                <Text
                  style={[
                    styles.optionCaption,
                    { color: colors.textSecondary },
                  ]}
                >
                  {mode.caption}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          App theme
        </Text>
        <View style={styles.accentOptions}>
          {accents.map((accent) => {
            const selected = draft.accent === accent.value;
            return (
              <Pressable
                key={accent.value}
                accessibilityRole="radio"
                accessibilityLabel={`${accent.label} theme`}
                accessibilityState={{ checked: selected }}
                onPress={() =>
                  setDraft((current) => ({
                    ...current,
                    accent: accent.value,
                  }))
                }
                style={[
                  styles.accentCard,
                  {
                    borderColor: selected ? accent.color : colors.border,
                    backgroundColor: colors.backgroundElement,
                  },
                ]}
              >
                <View
                  style={[styles.swatch, { backgroundColor: accent.color }]}
                />
                <View style={styles.accentCopy}>
                  <Text style={[styles.optionTitle, { color: colors.text }]}>
                    {accent.label}
                  </Text>
                  {selected && (
                    <Text
                      style={[styles.selectedText, { color: colors.primary }]}
                    >
                      Selected
                    </Text>
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Text size
        </Text>
        <View style={styles.fontOptions}>
          {fontSizes.map((fontSize) => {
            const selected = draft.fontSize === fontSize.value;
            return (
              <Pressable
                key={fontSize.value}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected }}
                onPress={() =>
                  setDraft((current) => ({
                    ...current,
                    fontSize: fontSize.value,
                  }))
                }
                style={[
                  styles.fontOption,
                  {
                    borderColor: selected ? colors.primary : colors.border,
                    backgroundColor: selected
                      ? colors.backgroundSelected
                      : colors.backgroundElement,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.fontOptionText,
                    {
                      color: colors.text,
                      fontSize: 12 * scales[fontSize.value],
                    },
                  ]}
                >
                  {fontSize.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View
          style={[
            styles.motionRow,
            {
              backgroundColor: colors.backgroundElement,
              borderColor: colors.border,
            },
          ]}
        >
          <View style={styles.motionCopy}>
            <Text style={[styles.optionTitle, { color: colors.text }]}>
              Reduce motion
            </Text>
            <Text
              style={[styles.optionCaption, { color: colors.textSecondary }]}
            >
              Limit decorative animation
            </Text>
          </View>
          <Switch
            accessibilityLabel="Reduce motion"
            value={draft.reduceMotion}
            onValueChange={(reduceMotion) =>
              setDraft((current) => ({ ...current, reduceMotion }))
            }
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.backgroundElement}
          />
        </View>

        <Pressable
          accessibilityRole="button"
          disabled={!changed || saving || !isReady}
          onPress={() => void apply()}
          style={[
            styles.applyButton,
            { backgroundColor: colors.primary },
            (!changed || saving || !isReady) && styles.disabled,
          ]}
        >
          {saving ? (
            <ActivityIndicator color={colors.onPrimary} />
          ) : (
            <Text style={[styles.applyText, { color: colors.onPrimary }]}>
              Apply appearance
            </Text>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: 20, paddingBottom: 38 },
  back: { alignSelf: "flex-start", paddingVertical: 9 },
  backText: { fontSize: 13, fontWeight: "700" },
  eyebrow: { fontSize: 9, letterSpacing: 1.7, fontWeight: "900", marginTop: 15 },
  title: { fontSize: 31, fontFamily: "serif", fontWeight: "700", marginTop: 5 },
  subtitle: { fontSize: 12, lineHeight: 18, marginTop: 7 },
  previewCard: { borderWidth: 1, borderRadius: 18, padding: 16, marginTop: 19 },
  previewLabel: { fontSize: 8, letterSpacing: 1.5, fontWeight: "900" },
  previewTitle: { fontFamily: "serif", fontWeight: "700", marginTop: 8 },
  previewSurface: { borderRadius: 11, padding: 12, marginTop: 12 },
  previewBody: { lineHeight: 17 },
  previewButton: { alignSelf: "flex-start", borderRadius: 10, paddingHorizontal: 13, paddingVertical: 10, marginTop: 12 },
  previewButtonText: { fontSize: 11, fontWeight: "800" },
  sectionTitle: { fontSize: 16, fontWeight: "800", marginTop: 24, marginBottom: 10 },
  modeOptions: { flexDirection: "row", gap: 8 },
  modeCard: { flex: 1, minHeight: 74, borderWidth: 1, borderRadius: 12, padding: 10, justifyContent: "center" },
  optionTitle: { fontSize: 12, fontWeight: "800" },
  optionCaption: { fontSize: 10, lineHeight: 14, marginTop: 4 },
  accentOptions: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  accentCard: { minWidth: "48%", flexGrow: 1, flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: 12, padding: 11, gap: 9 },
  swatch: { width: 21, height: 21, borderRadius: 11 },
  accentCopy: { flex: 1 },
  selectedText: { fontSize: 9, fontWeight: "700", marginTop: 3 },
  fontOptions: { flexDirection: "row", gap: 8 },
  fontOption: { flex: 1, alignItems: "center", justifyContent: "center", minHeight: 43, borderWidth: 1, borderRadius: 11 },
  fontOptionText: { fontWeight: "700" },
  motionRow: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: 13, paddingHorizontal: 13, paddingVertical: 10, marginTop: 20 },
  motionCopy: { flex: 1 },
  applyButton: { minHeight: 48, borderRadius: 12, alignItems: "center", justifyContent: "center", paddingHorizontal: 16, paddingVertical: 12, marginTop: 21 },
  applyText: { fontSize: 13, fontWeight: "900" },
  disabled: { opacity: 0.5 },
});
