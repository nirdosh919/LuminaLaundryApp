import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BrandColors } from "@/constants/theme";
import {
  formatAddress,
  getSelectedAddressId,
  loadAddresses,
} from "@/lib/address-book";
import { useAppTheme } from "@/providers/app-theme-provider";
import { useThemedStyles } from "@/hooks/use-themed-styles";
import { LuminaLogo } from "@/components/brand-ui";
import { signOut, updateCustomerProfile } from "@/lib/auth";
import { useRoleAccess } from "@/providers/role-access-provider";

const GREEN = BrandColors.forest;
const DARK = BrandColors.ink;
const CREAM = BrandColors.cream;
const PROFILE_KEY = "lumina_profile";

type ProfileDetails = {
  name: string;
  phone: string;
  email: string;
  address: string;
};

const EMPTY_PROFILE: ProfileDetails = {
  name: "",
  phone: "",
  email: "",
  address: "",
};

function parseProfile(value: unknown): ProfileDetails {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return EMPTY_PROFILE;
  }

  const stored = value as Record<string, unknown>;
  return {
    name: typeof stored.name === "string" ? stored.name : "",
    phone: typeof stored.phone === "string" ? stored.phone : "",
    email: typeof stored.email === "string" ? stored.email : "",
    address: typeof stored.address === "string" ? stored.address : "",
  };
}

const menuItems = [
  { icon: "⌂", title: "Saved Addresses", subtitle: "Manage pickup locations", route: "/addresses" },
  { icon: "✦", title: "Offers & rewards", subtitle: "Offers, plans and loyalty preview", route: "/loyalty" },
  { icon: "♡", title: "Help & Support", subtitle: "We're here to help", route: "/support" },
];

export default function ProfileScreen() {
  const router = useRouter();
  const { effectiveMode } = useAppTheme();
  const { clearRole } = useRoleAccess();
  const styles = useThemedStyles(baseStyles);
  const [profile, setProfile] = useState<ProfileDetails>(EMPTY_PROFILE);
  const [draft, setDraft] = useState<ProfileDetails>(EMPTY_PROFILE);
  const [isEditing, setIsEditing] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      const loadProfile = async () => {
        const [raw, session, addresses, selectedId] = await Promise.all([
          AsyncStorage.getItem(PROFILE_KEY),
          AsyncStorage.getItem("lumina_mobile_session"),
          loadAddresses(),
          getSelectedAddressId(),
        ]);
        if (!active) return;

        const parsed: unknown = raw ? JSON.parse(raw) : null;
        const selectedAddress =
          addresses.find((item) => item.id === selectedId) ??
          addresses.find((item) => item.isDefault) ??
          null;
        const saved = {
          ...parseProfile(parsed),
          ...(selectedAddress ? { address: formatAddress(selectedAddress) } : {}),
        };
        setProfile(saved);
        setDraft(saved);
        setIsAuthenticated(Boolean(session));
      };

      loadProfile().catch((error: unknown) => {
        console.error("Profile load failed:", error);
        if (active) Alert.alert("Could not load profile", "Please try again.");
      });

      return () => {
        active = false;
      };
    }, [])
  );

  const requestSignOut = () => {
    Alert.alert("Sign out?", "You can sign in again at any time.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: () => {
          setIsSigningOut(true);
          void signOut()
            .catch((error: unknown) => {
              Alert.alert(
                "Sign-out issue",
                error instanceof Error ? error.message : "Please try again.",
              );
            })
            .finally(() => {
              clearRole();
              setIsAuthenticated(false);
              setIsSigningOut(false);
              router.replace("/role-login" as never);
            });
        },
      },
    ]);
  };

  const saveProfile = async () => {
    if (!draft.name.trim()) {
      Alert.alert("Name required", "Enter your name before saving.");
      return;
    }
    if (!/^[6-9]\d{9}$/.test(draft.phone.trim())) {
      Alert.alert(
        "Invalid mobile number",
        "Enter a 10-digit Indian mobile number starting with 6, 7, 8, or 9."
      );
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(draft.email.trim())) {
      Alert.alert("Invalid email", "Enter a valid email address.");
      return;
    }
    if (isAuthenticated && draft.email.trim() !== profile.email) {
      Alert.alert(
        "Email update unavailable",
        "The connected account API can update your name and phone number, but not your email. Keep the account email unchanged and contact support if it needs to be changed.",
      );
      return;
    }
    const updated: ProfileDetails = {
      name: draft.name.trim(),
      phone: draft.phone.trim(),
      email: draft.email.trim(),
      address: draft.address.trim(),
    };

    try {
      if (isAuthenticated) {
        const account = await updateCustomerProfile({ name: updated.name, phone: updated.phone });
        await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify({ ...account, address: updated.address }));
      } else {
        await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(updated));
      }
      setProfile(updated);
      setDraft(updated);
      setIsEditing(false);
      Alert.alert("Profile saved", "Your profile details have been saved.");
    } catch (error: unknown) {
      console.error("Profile save failed:", error);
      Alert.alert(
        "Could not save profile",
        error instanceof Error ? error.message : "Please try again.",
      );
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <StatusBar
        barStyle={effectiveMode === "dark" ? "light-content" : "dark-content"}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
          <LuminaLogo height={32} />
          <View style={styles.headerPill}>
            <Text style={styles.headerLabel}>MY ACCOUNT</Text>
          </View>
        </View>

        <View style={styles.heroRow}>
          <View style={styles.heroCopy}>
            <Text style={styles.eyebrow}>YOUR ACCOUNT</Text>
            <Text style={styles.title}>{profile.name ? "My Profile" : "Welcome to Lumina"}</Text>
          </View>
          <Text style={styles.heroMark}>✦</Text>
        </View>
        <Text style={styles.subtitle}>
          {profile.name
            ? "Manage your details and make laundry day simpler."
            : "Sign in to track orders and save addresses"}
        </Text>

        <View style={styles.profileCard}>
          <View style={styles.profileCardTop}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {profile.name.trim().charAt(0).toUpperCase() || "L"}
              </Text>
            </View>
            <View style={styles.profileIdentity}>
              <Text style={styles.profileOverline}>LUMINA MEMBER</Text>
              <Text style={styles.customerName}>
                {profile.name || "Your name"}
              </Text>
              <Text style={styles.profileStatus}>
                {profile.name ? "Your care, beautifully organized" : "Complete your profile to get started"}
              </Text>
            </View>
          </View>
          {!isEditing ? (
            <>
              <View style={styles.profileDetails}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>PHONE</Text>
                  <Text style={styles.profileDetail}>{profile.phone || "Not provided"}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>EMAIL</Text>
                  <Text style={styles.profileDetail}>{profile.email || "Not provided"}</Text>
                </View>
                <View style={[styles.detailRow, styles.lastDetailRow]}>
                  <Text style={styles.detailLabel}>PICKUP ADDRESS</Text>
                  <Text style={styles.profileDetail}>{profile.address || "Not provided"}</Text>
                </View>
              </View>
            </>
          ) : (
            <View style={styles.profileForm}>
              <Text style={styles.inputLabel}>Customer name</Text>
              <TextInput
                style={styles.input}
                value={draft.name}
                onChangeText={(name) => setDraft((current) => ({ ...current, name }))}
                placeholder="Enter your name"
                placeholderTextColor="#4B5B50"
                accessibilityLabel="Customer name"
              />
              <Text style={styles.inputLabel}>Phone number</Text>
              <TextInput
                style={styles.input}
                value={draft.phone}
                onChangeText={(phone) => setDraft((current) => ({ ...current, phone: phone.replace(/\D/g, "") }))}
                placeholder="10-digit mobile number"
                placeholderTextColor="#4B5B50"
                keyboardType="phone-pad"
                maxLength={10}
                accessibilityLabel="Phone number"
              />
              <Text style={styles.inputLabel}>Email</Text>
              {isAuthenticated ? (
                <Text style={styles.addressSummary}>
                  {profile.email || "Not provided"} · Email changes are not supported by the account API.
                </Text>
              ) : (
                <TextInput
                  style={styles.input}
                  value={draft.email}
                  onChangeText={(email) => setDraft((current) => ({ ...current, email }))}
                  placeholder="Enter your email"
                  placeholderTextColor="#4B5B50"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  accessibilityLabel="Email"
                />
              )}
              <Text style={styles.inputLabel}>Pickup address</Text>
              <Text style={styles.addressSummary}>
                {draft.address || "No saved pickup address selected"}
              </Text>
              <Pressable
                style={styles.addressPicker}
                onPress={() => router.push("/addresses")}
                accessibilityRole="button"
              >
                <Text style={styles.addressPickerText}>
                  Manage saved addresses  →
                </Text>
              </Pressable>
            </View>
          )}
          <View style={styles.guestBadge}>
            <Text style={styles.guestBadgeText}>{profile.name ? "PROFILE DETAILS" : "YOUR LUMINA PROFILE"}</Text>
          </View>
          <Pressable
            style={styles.signInButton}
            onPress={() => {
              if (isEditing) {
                void saveProfile();
              } else {
                setDraft(profile);
                setIsEditing(true);
              }
            }}
          >
            <Text style={styles.signInText}>
              {isEditing ? "Save Profile" : "Edit Profile"}
            </Text>
          </Pressable>
          {isEditing && (
            <Pressable
              style={styles.cancelEditButton}
              onPress={() => {
                setDraft(profile);
                setIsEditing(false);
              }}
            >
              <Text style={styles.cancelEditText}>Cancel</Text>
            </Pressable>
          )}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Account Settings</Text>
          <Text style={styles.sectionSubtitle}>YOUR PREFERENCES</Text>
        </View>

        {menuItems.map((item) => (
          <Pressable
            key={item.title}
            style={styles.menuCard}
            onPress={() => router.push(item.route as never)}
          >
            <View style={styles.menuIconBox}>
              <Text style={styles.menuIcon}>{item.icon}</Text>
            </View>
            <View style={styles.menuBody}>
              <Text style={styles.menuTitle}>{item.title}</Text>
              <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </Pressable>
        ))}

        <View style={styles.supportCard}>
          <Text style={styles.supportIcon}>✧</Text>
          <Text style={styles.supportTitle}>Need a little help?</Text>
          <Text style={styles.supportText}>
            Have a question about your laundry? Our support team will help you
            find the right answer.
          </Text>
          <Pressable
            style={styles.supportButton}
            onPress={() => router.push("/support" as never)}
          >
            <Text style={styles.supportButtonText}>Contact Support →</Text>
          </Pressable>
        </View>

        {!isAuthenticated && (
          <Pressable
            style={styles.adminButton}
            onPress={() => router.push("/login" as never)}
          >
            <Text style={styles.adminButtonText}>Sign in or create account →</Text>
          </Pressable>
        )}
        {isAuthenticated && (
          <Pressable
            disabled={isSigningOut}
            style={[styles.signOutButton, isSigningOut && styles.disabledButton]}
            onPress={requestSignOut}
          >
            <Text style={styles.signOutButtonText}>
              {isSigningOut ? "Signing out…" : "Sign out"}
            </Text>
          </Pressable>
        )}
        <Text style={styles.footer}>LUMINA · CARE IN EVERY THREAD</Text>
        <Text style={styles.version}>App preview · Version 1.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const baseStyles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: CREAM },
  content: { paddingHorizontal: 20, paddingBottom: 30 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#CDD8CE",
  },
  brand: { color: GREEN, fontSize: 25, letterSpacing: 4, fontFamily: "serif", fontWeight: "700" },
  brandSub: { color: "#4B5B50", fontSize: 8, letterSpacing: 2.5, marginTop: 4 },
  headerPill: {
    backgroundColor: "#E3EEE6",
    borderRadius: 20,
    paddingHorizontal: 11,
    paddingVertical: 8,
  },
  headerLabel: {
    color: GREEN,
    fontSize: 9,
    letterSpacing: 1.2,
    fontWeight: "800",
  },
  heroRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginTop: 26 },
  heroCopy: { flex: 1 },
  heroMark: { color: BrandColors.gold, fontSize: 30, marginBottom: 3, marginRight: 4 },
  eyebrow: { color: GREEN, fontSize: 9, letterSpacing: 1.6 },
  title: {
    color: DARK,
    fontSize: 34,
    fontFamily: "serif",
    fontWeight: "700",
    marginTop: 7,
  },
  subtitle: { color: "#4B5B50", fontSize: 12, lineHeight: 19, marginTop: 9, maxWidth: 285 },
  profileCard: {
    backgroundColor: GREEN,
    borderRadius: 24,
    padding: 20,
    marginTop: 23,
    borderWidth: 1,
    borderColor: BrandColors.forest,
  },
  profileCardTop: { flexDirection: "row", alignItems: "center", width: "100%" },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: BrandColors.gold,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: "#2F674A",
  },
  avatarText: { color: DARK, fontSize: 32, fontFamily: "serif" },
  profileIdentity: { flex: 1, marginLeft: 14 },
  profileOverline: { color: BrandColors.gold, fontSize: 8, letterSpacing: 1.5, fontWeight: "800" },
  customerName: {
    color: "#FFFDFA",
    fontSize: 20,
    fontWeight: "700",
    fontFamily: "serif",
    marginTop: 4,
  },
  profileStatus: { color: "#E3EEE6", fontSize: 10, lineHeight: 15, marginTop: 3 },
  profileDetails: { width: "100%", marginTop: 19, backgroundColor: "#2F674A", borderRadius: 15, paddingHorizontal: 13 },
  detailRow: { paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: "#5B806A" },
  lastDetailRow: { borderBottomWidth: 0 },
  detailLabel: { color: BrandColors.gold, fontSize: 8, letterSpacing: 1.2, fontWeight: "800", marginBottom: 3 },
  profileDetail: { color: "#FFFDFA", fontSize: 11, lineHeight: 16 },
  profileForm: { width: "100%", marginTop: 14 },
  inputLabel: { color: "#FFFDFA", fontSize: 11, fontWeight: "700", marginTop: 13, marginBottom: 6 },
  input: {
    backgroundColor: "#FFFDFA",
    borderWidth: 1,
    borderColor: "#CDD8CE",
    borderRadius: 11,
    padding: 12,
    color: DARK,
    fontSize: 13,
  },
  addressSummary: {
    color: "#FFFDFA",
    backgroundColor: "#2F674A",
    borderRadius: 11,
    padding: 12,
    fontSize: 12,
    lineHeight: 18,
  },
  addressPicker: { paddingVertical: 12, alignSelf: "flex-start" },
  addressPickerText: { color: BrandColors.gold, fontSize: 11, fontWeight: "800" },
  guestBadge: {
    backgroundColor: BrandColors.gold,
    borderRadius: 20,
    paddingHorizontal: 11,
    paddingVertical: 6,
    marginTop: 16,
  },
  guestBadgeText: {
    color: DARK,
    fontSize: 8,
    letterSpacing: 1.3,
    fontWeight: "700",
  },
  signInButton: {
    backgroundColor: BrandColors.gold,
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 20,
    marginTop: 16,
    width: "100%",
    alignItems: "center",
  },
  signInText: { color: DARK, fontSize: 12, fontWeight: "800" },
  cancelEditButton: { padding: 12, marginTop: 4 },
  cancelEditText: { color: BrandColors.gold, fontSize: 12, fontWeight: "700" },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 32,
    marginBottom: 14,
  },
  sectionTitle: {
    color: DARK,
    fontSize: 21,
    fontFamily: "serif",
    fontWeight: "700",
  },
  sectionSubtitle: { color: "#4B5B50", fontSize: 8, letterSpacing: 1 },
  menuCard: {
    backgroundColor: "#FFFDFA",
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "#CDD8CE",
    padding: 13,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  menuIconBox: {
    width: 43,
    height: 43,
    borderRadius: 13,
    backgroundColor: "#E3EEE6",
    alignItems: "center",
    justifyContent: "center",
  },
  menuIcon: { color: GREEN, fontSize: 23 },
  menuBody: { flex: 1, marginLeft: 12 },
  menuTitle: { color: DARK, fontSize: 12, fontWeight: "700" },
  menuSubtitle: { color: "#4B5B50", fontSize: 10, marginTop: 5 },
  arrow: { color: GREEN, fontSize: 24 },
  supportCard: {
    backgroundColor: GREEN,
    borderRadius: 18,
    padding: 20,
    marginTop: 18,
  },
  supportIcon: { color: "#E3EEE6", fontSize: 25 },
  supportTitle: {
    color: "#FFFDFA",
    fontSize: 18,
    fontFamily: "serif",
    fontWeight: "700",
    marginTop: 8,
  },
  supportText: { color: "#E3EEE6", fontSize: 11, lineHeight: 18, marginTop: 8 },
  supportButton: {
    backgroundColor: CREAM,
    borderRadius: 11,
    padding: 12,
    alignItems: "center",
    marginTop: 15,
  },
  supportButtonText: { color: GREEN, fontSize: 11, fontWeight: "700" },
  footer: {
    textAlign: "center",
    color: "#4B5B50",
    fontSize: 8,
    letterSpacing: 2,
    marginTop: 25,
  },
  adminButton: {
    backgroundColor: "#E3EEE6",
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    marginTop: 18,
  },
  adminButtonText: { color: "#214738", fontSize: 12, fontWeight: "700" },
  signOutButton: {
    alignItems: "center",
    backgroundColor: "#F5E8E4",
    borderRadius: 12,
    marginTop: 10,
    padding: 13,
  },
  disabledButton: { opacity: 0.6 },
  signOutButtonText: { color: "#8B3A2B", fontSize: 12, fontWeight: "800" },
  version: { textAlign: "center", color: "#4B5B50", fontSize: 9, marginTop: 7 },
});
