import { router, useFocusEffect, type RelativePathString } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { DEMO_SERVICES } from "@/lib/demo-store";
import { fetchOrders, type MobileOrder } from "@/lib/laundry-api";
import type { AppThemeColors } from "@/constants/theme";
import {
  getSelectedAddressId,
  loadAddresses,
  type SavedAddress,
} from "@/lib/address-book";
import { useAppTheme } from "@/providers/app-theme-provider";

type HomeColors = {
  forest: string;
  green: string;
  mint: string;
  gold: string;
  navy: string;
  aqua: string;
  softAqua: string;
  background: string;
  surface: string;
  text: string;
  muted: string;
  border: string;
  danger: string;
  fontScale: number;
};

function getHomeColors(theme: AppThemeColors, fontScale: number): HomeColors {
  return {
    forest: theme.primaryStrong,
    green: theme.primary,
    mint: theme.accentSoft,
    gold: theme.gold,
    navy: theme.text,
    aqua: theme.primary,
    softAqua: theme.accentSoft,
    background: theme.background,
    surface: theme.backgroundElement,
    text: theme.text,
    muted: theme.textSecondary,
    border: theme.border,
    danger: theme.danger,
    fontScale,
  };
}

export default function HomeScreen() {
  const { colors: themeColors, fontScale, preferences } = useAppTheme();
  const colors = useMemo(
    () => getHomeColors(themeColors, fontScale),
    [fontScale, themeColors],
  );
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [bookings, setBookings] = useState<MobileOrder[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<SavedAddress | null>(null);
  const [loadError, setLoadError] = useState("");
  const [appReady, setAppReady] = useState(false);
  const reloadHome = useCallback(async () => {
    setLoadError("");
    try {
      // Onboarding redirect temporarily disabled to isolate navigation loop.
      const [savedBookings, addresses, selectedId] = await Promise.all([
        fetchOrders(),
        loadAddresses(),
        getSelectedAddressId(),
      ]);
      setBookings(savedBookings);
      setSelectedAddress(
        addresses.find((item) => item.id === selectedId) ??
          addresses.find((item) => item.isDefault) ??
          null,
      );
    } catch (error: unknown) {
      setLoadError(error instanceof Error ? error.message : "Please try again.");
    } finally {
      setAppReady(true);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void reloadHome();
    }, [reloadHome]),
  );

  const latestBooking = bookings[0];

  if (!appReady) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.initialLoading}>
          <ActivityIndicator size="large" color={colors.aqua} />
          <Text style={styles.serviceDescription}>Getting things ready…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Choose a pickup address"
            onPress={() => router.push("/addresses")}
            style={styles.locationButton}
          >
            <Text style={styles.locationIcon}>⌖</Text>
            <View>
              <Text style={styles.locationCaption}>PICKUP ADDRESS</Text>
              <Text style={styles.locationTitle}>
                {selectedAddress
                  ? `${selectedAddress.label === "Other" ? selectedAddress.customLabel || "Other" : selectedAddress.label} · ${selectedAddress.city}`
                  : "Choose pickup address"}
              </Text>
            </View>
            <Text style={styles.locationChevron}>⌄</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Search services"
            onPress={() => router.push("/search" as RelativePathString)}
            style={styles.notificationButton}
          >
            <Text style={styles.notificationIcon}>⌕</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Notifications"
            onPress={() => router.push("/notifications")}
            style={styles.notificationButton}
          >
            <Text style={styles.notificationIcon}>♧</Text>
          </Pressable>
        </View>

        <Animated.View
          entering={preferences.reduceMotion ? undefined : FadeInDown.duration(480)}
          style={styles.heroSection}
        >
          <Text style={styles.greeting}>GOOD MORNING</Text>
          <Text style={styles.heroTitle}>Fresh clothes,{`\n`}zero effort.</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push("/services")}
            style={styles.promoCard}
          >
            <View style={styles.promoCopy}>
              <Text style={styles.promoEyebrow}>LUMINA CARE</Text>
                <Text style={styles.promoTitle}>Laundry care,{"\n"}made thoughtful</Text>
                <Text style={styles.promoDescription}>Explore services in the local preview</Text>
              <View style={styles.promoButton}>
                <Text style={styles.promoButtonText}>Explore services  →</Text>
              </View>
            </View>
            <View pointerEvents="none" style={styles.promoDecoration}>
              <View style={styles.promoOrb} />
              <Text style={styles.promoSparkle}>✦</Text>
              <View style={styles.promoDot} />
            </View>
          </Pressable>
          <Text style={styles.heroNote}>Book a pickup and track your order here</Text>
        </Animated.View>

        <View style={styles.sectionHeading}>
          <View>
            <Text style={styles.eyebrow}>WHAT WE CARE FOR</Text>
            <Text style={styles.sectionTitle}>Our services</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push("/services")}
          >
            <Text style={styles.textLink}>View all  →</Text>
          </Pressable>
        </View>

        <ScrollView
          horizontal
          contentContainerStyle={styles.serviceGrid}
          showsHorizontalScrollIndicator={false}
        >
          {DEMO_SERVICES.slice(0, 3).map((service) => (
            <Pressable
              key={service.id}
              accessibilityRole="button"
              onPress={() => router.push("/services")}
              style={styles.serviceCard}
            >
              <View style={styles.serviceIcon}>
                <Text style={styles.serviceIconText}>{service.icon}</Text>
              </View>
              <Text style={styles.serviceTitle}>{service.name}</Text>
              <Text style={styles.servicePrice}>
                {service.id === 1
                  ? `₹${service.price}/${service.unit}`
                  : `From ₹${service.price}`}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <Pressable
          accessibilityRole="button"
          onPress={() => router.push("/orders")}
          style={styles.promiseCard}
        >
          <Text style={styles.promiseIcon}>✦</Text>
          <View style={styles.promiseCopy}>
            <Text style={styles.promiseEyebrow}>LUMINA CARE</Text>
            <Text style={styles.promiseTitle}>Gentle care for every favourite.</Text>
          </View>
          <Text style={styles.promiseArrow}>→</Text>
        </Pressable>

        <View style={styles.processCard}>
          <Text style={styles.eyebrow}>HOW IT WORKS</Text>
          <Text style={styles.sectionTitle}>Easy as 1, 2, 3</Text>
          {[
            ["1", "Schedule", "Choose a pickup time."],
            ["2", "We clean", "Your clothes get expert care."],
            ["3", "Delivered", "Fresh laundry at your door."],
          ].map(([number, title, description]) => (
            <View key={number} style={styles.processRow}>
              <Text style={styles.processNumber}>{number}</Text>
              <View style={styles.processCopy}>
                <Text style={styles.processTitle}>{title}</Text>
                <Text style={styles.processDescription}>{description}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.orderPanel}>
          <View style={styles.sectionHeading}>
            <View>
              <Text style={styles.eyebrow}>YOUR LATEST BOOKING</Text>
              <Text style={styles.sectionTitle}>Order overview</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push("/orders")}
            >
              <Text style={styles.textLink}>View all  →</Text>
            </Pressable>
          </View>
          {loadError ? (
            <View style={styles.inlineError}>
              <Text style={styles.errorText}>{loadError}</Text>
              <Pressable onPress={() => void reloadHome()}>
                <Text style={styles.textLink}>Retry</Text>
              </Pressable>
            </View>
          ) : latestBooking ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push("/orders")}
              style={styles.latestOrder}
            >
              <View style={styles.orderIcon}>
                <Text style={styles.serviceIconText}>◷</Text>
              </View>
              <View style={styles.latestOrderCopy}>
                <Text style={styles.latestOrderTitle}>
                  {latestBooking.service}
                </Text>
                <Text style={styles.latestOrderDescription}>
                  #{latestBooking.order_number} · {latestBooking.status_label}
                </Text>
              </View>
              <Text style={styles.textLink}>→</Text>
            </Pressable>
          ) : (
            <View style={styles.emptyOrders}>
              <Text style={styles.emptyOrderTitle}>Your next fresh start is one tap away.</Text>
              <Text style={styles.serviceDescription}>
                Your bookings will appear here once available.
              </Text>
              <Pressable onPress={() => router.push("/services")}>
                <Text style={styles.textLink}>Browse services  →</Text>
              </Pressable>
            </View>
          )}
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() => router.push("/stores" as RelativePathString)}
          style={styles.supportLink}
        >
          <Text style={styles.supportText}>Find a participating shop  →</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={() => router.push("/support")}
          style={styles.supportLink}
        >
          <Text style={styles.supportText}>Need a hand? Visit Help & Support  →</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(colors: HomeColors) {
  return StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  initialLoading: { flex: 1, justifyContent: "center", alignItems: "center", gap: 10 },
  content: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 36 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 25 },
  locationButton: { flexDirection: "row", alignItems: "center", gap: 10 },
  locationIcon: { color: colors.navy, fontSize: 23 * colors.fontScale, fontWeight: "700" },
  locationCaption: { color: colors.muted, fontSize: 9 * colors.fontScale, letterSpacing: 1, fontWeight: "700" },
  locationTitle: { color: colors.navy, fontSize: 13 * colors.fontScale, fontWeight: "800", marginTop: 3 },
  locationChevron: { color: colors.navy, fontSize: 17 * colors.fontScale, marginLeft: 1 },
  notificationButton: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center", backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  notificationIcon: { color: colors.navy, fontSize: 19 * colors.fontScale },
  heroSection: { marginBottom: 12 },
  greeting: { color: colors.muted, fontSize: 10 * colors.fontScale, letterSpacing: 2, fontWeight: "800" },
  heroTitle: { color: colors.navy, fontSize: 33 * colors.fontScale, lineHeight: 39 * colors.fontScale, fontFamily: "serif", fontWeight: "700", marginTop: 7, marginBottom: 17 },
  promoCard: { minHeight: 203, borderRadius: 23, backgroundColor: colors.navy, overflow: "hidden", padding: 18, flexDirection: "row", alignItems: "center" },
  promoCopy: { width: "100%", zIndex: 1, alignItems: "flex-start" },
  promoEyebrow: { color: colors.gold, fontSize: 9 * colors.fontScale, letterSpacing: 1.4, fontWeight: "900" },
  promoTitle: { color: colors.surface, fontSize: 23 * colors.fontScale, lineHeight: 27 * colors.fontScale, fontFamily: "serif", fontWeight: "700", marginTop: 8 },
  promoDescription: { color: colors.surface, fontSize: 10 * colors.fontScale, marginTop: 7 },
  promoButton: { backgroundColor: colors.gold, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, marginTop: 14 },
  promoButtonText: { color: colors.navy, fontSize: 10 * colors.fontScale, fontWeight: "900" },
  promoDecoration: { position: "absolute", right: 0, top: 0, bottom: 0, width: 140, overflow: "hidden" },
  promoOrb: { position: "absolute", width: 150, height: 150, borderRadius: 75, right: -52, top: 30, backgroundColor: colors.green, opacity: 0.8 },
  promoSparkle: { position: "absolute", color: colors.gold, fontSize: 33 * colors.fontScale, right: 26, top: 28 },
  promoDot: { position: "absolute", width: 11, height: 11, borderRadius: 6, right: 89, bottom: 35, backgroundColor: colors.gold },
  heroNote: { color: colors.muted, fontSize: 9 * colors.fontScale, textAlign: "center", marginTop: 8 },
  eyebrow: { color: colors.green, fontSize: 9 * colors.fontScale, letterSpacing: 1.6, fontWeight: "900" },
  sectionHeading: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginTop: 23, marginBottom: 13 },
  sectionTitle: { color: colors.text, fontSize: 23 * colors.fontScale, fontFamily: "serif", fontWeight: "700", marginTop: 5 },
  textLink: { color: colors.navy, fontSize: 11 * colors.fontScale, fontWeight: "900" },
  serviceGrid: { flexDirection: "row", gap: 11, paddingRight: 20 },
  serviceCard: { width: 145, minHeight: 145, backgroundColor: colors.surface, borderRadius: 17, borderWidth: 1, borderColor: colors.border, padding: 13 },
  serviceIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: colors.mint, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  serviceIconText: { color: colors.navy, fontSize: 19 * colors.fontScale, fontWeight: "700" },
  serviceTitle: { color: colors.navy, fontSize: 12 * colors.fontScale, lineHeight: 16 * colors.fontScale, fontWeight: "800" },
  servicePrice: { color: colors.green, fontSize: 11 * colors.fontScale, fontWeight: "800", marginTop: 7 },
  serviceDescription: { color: colors.muted, fontSize: 10 * colors.fontScale, lineHeight: 15 * colors.fontScale, marginTop: 5 },
  promiseCard: { flexDirection: "row", alignItems: "center", backgroundColor: colors.mint, borderRadius: 16, padding: 14, marginTop: 19, gap: 10 },
  promiseIcon: { color: colors.forest, fontSize: 22 * colors.fontScale },
  promiseCopy: { flex: 1 },
  promiseEyebrow: { color: colors.green, fontSize: 9 * colors.fontScale, fontWeight: "900", letterSpacing: 1.1 },
  promiseTitle: { color: colors.navy, fontSize: 12 * colors.fontScale, lineHeight: 17 * colors.fontScale, fontWeight: "800", marginTop: 3 },
  promiseArrow: { color: colors.navy, fontSize: 17 * colors.fontScale },
  processCard: { backgroundColor: colors.surface, borderRadius: 18, padding: 17, marginTop: 22, borderWidth: 1, borderColor: colors.border },
  processRow: { flex: 1, flexDirection: "column", alignItems: "center", marginTop: 17, gap: 8 },
  processNumber: { color: colors.gold, backgroundColor: colors.navy, fontWeight: "900", fontSize: 14 * colors.fontScale, textAlign: "center", textAlignVertical: "center", width: 38, height: 38, borderRadius: 19, overflow: "hidden" },
  processCopy: { alignItems: "center", flex: 1 },
  processTitle: { color: colors.navy, fontSize: 11 * colors.fontScale, fontWeight: "800", textAlign: "center" },
  processDescription: { color: colors.muted, fontSize: 9 * colors.fontScale, lineHeight: 13 * colors.fontScale, marginTop: 4, textAlign: "center" },
  orderPanel: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 18, padding: 16, marginTop: 22 },
  latestOrder: { flexDirection: "row", alignItems: "center", paddingVertical: 4 },
  orderIcon: { width: 42, height: 42, borderRadius: 13, backgroundColor: colors.mint, alignItems: "center", justifyContent: "center", marginRight: 11 },
  latestOrderCopy: { flex: 1 },
  latestOrderTitle: { color: colors.navy, fontSize: 12 * colors.fontScale, fontWeight: "800" },
  latestOrderDescription: { color: colors.muted, fontSize: 10 * colors.fontScale, marginTop: 5 },
  emptyOrders: { gap: 7, paddingVertical: 5 },
  emptyOrderTitle: { color: colors.text, fontSize: 13 * colors.fontScale, fontWeight: "700" },
  inlineError: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  errorText: { color: colors.danger, fontSize: 11 * colors.fontScale, flex: 1, marginRight: 8 },
  supportLink: { alignItems: "center", paddingVertical: 20 },
  supportText: { color: colors.muted, fontSize: 11 * colors.fontScale, fontWeight: "600" },
  });
}



