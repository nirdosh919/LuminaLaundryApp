import { StyleSheet, Text, View } from "react-native";
import type { LocationPoint } from "@/lib/location-search";
import { useAppTheme } from "@/providers/app-theme-provider";

export default function AddressMap({
  point,
}: {
  point: LocationPoint | null;
  onPointChange?: (point: LocationPoint) => void;
}) {
  const { colors } = useAppTheme();
  return (
    <View
      style={[
        styles.container,
        {
          borderColor: colors.border,
          backgroundColor: colors.backgroundElement,
        },
      ]}
    >
      <Text style={[styles.icon, { color: colors.primary }]}>⌖</Text>
      <Text style={[styles.title, { color: colors.text }]}>
        {point ? "Map preview needs a mobile development build" : "Choose a location to preview the map"}
      </Text>
      <Text style={[styles.message, { color: colors.textSecondary }]}>
        {point
          ? "Your selected coordinates are kept. Enter or confirm the street address manually."
          : "Use your current location or search for an address when configured. You can always type the address manually."}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 180,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
  },
  icon: { fontSize: 28 },
  title: { fontSize: 13, fontWeight: "800", marginTop: 8, textAlign: "center" },
  message: { fontSize: 11, lineHeight: 16, marginTop: 6, textAlign: "center" },
});
