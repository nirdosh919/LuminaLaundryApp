import AsyncStorage from "@react-native-async-storage/async-storage";
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
import { useRouter } from "expo-router";
import type { AppThemeColors } from "@/constants/theme";
import { useAppTheme } from "@/providers/app-theme-provider";

type Action = { label: string; route: string };
type Field = { label: string; placeholder: string; secure?: boolean; multiline?: boolean };
type Props = {
  title: string;
  eyebrow?: string;
  description: string;
  sections?: string[];
  actions?: Action[];
  fields?: Field[];
  storageKey?: string;
};

function copyFor(section: string, title: string): string {
  const value = `${title} ${section}`.toLowerCase();
  if (/pickup|delivery|schedule/.test(value)) return "Choose a pickup day and a convenient time window at checkout. Our demo keeps the selection on this device; a live driver assignment and arrival updates need the website API.";
  if (/payment|billing|price|revenue|commission/.test(value)) return "Service prices shown in this preview are sample prices. The final amount can depend on item inspection, shop pricing, taxes and any eligible offer. Live payment processing and financial reports need connected services.";
  if (/order|booking/.test(value)) return "Review your selected services, pickup details and current order status from the Orders tab. In this preview, changes are stored locally and cannot be seen by a laundry shop or driver.";
  if (/account|sign-in|access|credential/.test(value)) return "Your account profile can be saved on this device for the demo. Secure sign-in, password recovery and account synchronization require the customer authentication API.";
  if (/address|location/.test(value)) return "Save the places where you would like us to collect and return laundry. The demo stores these details locally; address validation and service-area coverage are confirmed by the live service.";
  if (/information collected/.test(value)) return "A real order may require your name, phone number, address, selected services and pickup preferences so the shop can fulfill it. Keep contact information accurate and share only the details needed for the service.";
  if (/how information|your choices|privacy/.test(value)) return "Order and account details should only be used to provide and support the service. Data retention, access requests and deletion need to be handled by the live account system; this app preview stores its sample data on this device.";
  if (/cancellation|terms|liability/.test(value)) return "Review your order details before confirming. Pickup availability, cancellation windows, garment-care limitations and liability are governed by the final service terms published by Lumina Laundry.";
  if (/story|quality|care/.test(value)) return "Lumina Laundry brings everyday laundry and specialist garment care together with convenient doorstep pickup and delivery. Each item should be handled according to its fabric and care label.";
  if (/franchise|partnership|operating support|enquiry/.test(value)) return "We welcome enquiries from local laundry operators interested in joining the Lumina network. Share your city, experience and preferred contact details; a partnership representative can follow up once enquiries are connected to the business system.";
  if (/support|enquiry|message/.test(value)) return "For help with an order, include its reference number and the phone number used at checkout. Contact forms in this preview are local only; messages cannot reach the support team until the contact API is connected.";
  if (/plan|subscription|benefit/.test(value)) return "Plans and benefits depend on the current business offering. This preview does not charge a subscription; live plan availability, renewal and billing require the website API.";
  if (/category|wash|dry cleaning|special garment/.test(value)) return "Browse laundry and garment-care options, compare the unit price, then add the service to your cart. Prices in this app are starter demo values and need confirmation against the live catalog.";
  if (/notification/.test(value)) return "Order reminders and status changes are shown in the customer account when notifications are configured. Push notifications and delivery updates require backend events and notification credentials.";
  if (/driver|shop|customer|service|coupon|promotion|category|dashboard|report|analytics|message/.test(value)) return "This workspace is a local preview of the website feature. You can explore the available screens and sample interactions; shared records, permissions, and business updates become available after the related API is connected.";
  return "Explore this part of Lumina Laundry. This app preview keeps demo interactions on the device; live account data and transactions become available when the website API is connected.";
}

export default function WebsitePage({
  title,
  eyebrow = "LUMINA LAUNDRY",
  description,
  sections = [],
  actions = [],
  fields = [],
  storageKey,
}: Props) {
  const router = useRouter();
  const { colors } = useAppTheme();
  const s = createStyles(colors);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const saveEnquiry = async () => {
    if (!storageKey) {
      Alert.alert("Enquiry unavailable", "This form is not configured for saving.");
      return;
    }
    const missing = fields.find((field) => !values[field.label]?.trim());
    if (missing) {
      Alert.alert("Required", `Enter ${missing.label.toLowerCase()}.`);
      return;
    }
    const email = fields.find((field) => /email/i.test(field.label));
    if (email && !/^\S+@\S+\.\S+$/.test(values[email.label].trim())) {
      Alert.alert("Check your email", "Enter a valid email address.");
      return;
    }
    const phone = fields.find((field) => /phone|mobile/i.test(field.label));
    if (phone && !/^[6-9]\d{9}$/.test(values[phone.label].replace(/\D/g, ""))) {
      Alert.alert("Check your mobile number", "Enter a valid 10-digit Indian mobile number.");
      return;
    }

    setSaving(true);
    try {
      const raw = await AsyncStorage.getItem(storageKey);
      const previous: unknown = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(previous)) {
        throw new Error("Saved enquiries have an unexpected format.");
      }
      await AsyncStorage.setItem(
        storageKey,
        JSON.stringify([
          {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            createdAt: new Date().toISOString(),
            values,
          },
          ...previous,
        ]),
      );
      setSaved(true);
      Alert.alert(
        "Saved on this device",
        "Your enquiry has not been sent. Connecting the enquiry API is required to reach the Lumina team.",
      );
    } catch (error) {
      Alert.alert(
        "Could not save enquiry",
        error instanceof Error ? error.message : "Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView
      style={s.page}
      contentContainerStyle={s.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={s.eyebrow}>{eyebrow}</Text>
      <Text style={s.title}>{title}</Text>
      <Text style={s.description}>{description}</Text>
      {sections.map((section, i) => {
        const isExpanded = expanded === section;
        return (
          <Pressable
            key={`${i}-${section}`}
            accessibilityRole="button"
            accessibilityState={{ expanded: isExpanded }}
            onPress={() => setExpanded(isExpanded ? null : section)}
            style={s.card}
          >
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>{section}</Text>
              <Text style={s.chevron}>{isExpanded ? "−" : "+"}</Text>
            </View>
            {isExpanded && (
              <Text style={s.body}>{copyFor(section, title)}</Text>
            )}
          </Pressable>
        );
      })}
      {fields.length > 0 && (
        <View style={s.form}>
          <Text style={s.sectionTitle}>Send an enquiry</Text>
          {fields.map((field) => (
            <View key={field.label} style={s.field}>
              <Text style={s.label}>{field.label}</Text>
              <TextInput
                value={values[field.label] || ""}
                onChangeText={(value) => {
                  setValues((current) => ({
                    ...current,
                    [field.label]: value,
                  }));
                  setSaved(false);
                }}
                placeholder={field.placeholder}
                placeholderTextColor={colors.textSecondary}
                secureTextEntry={field.secure}
                multiline={field.multiline}
                keyboardType={
                  /email/i.test(field.label)
                    ? "email-address"
                    : /phone|mobile/i.test(field.label)
                      ? "phone-pad"
                      : "default"
                }
                autoCapitalize={/email/i.test(field.label) ? "none" : "sentences"}
                style={[s.input, field.multiline && s.multiline]}
                textAlignVertical={field.multiline ? "top" : "center"}
              />
            </View>
          ))}
          <Pressable
            disabled={saving}
            style={[s.button, saving && s.disabled]}
            onPress={() => void saveEnquiry()}
          >
            <Text style={s.buttonText}>
              {saving ? "Saving…" : saved ? "Save another enquiry" : "Save enquiry"}
            </Text>
          </Pressable>
          <Text style={s.noteText}>
            Saved on this device only. The enquiry is not sent until the API is connected.
          </Text>
        </View>
      )}
      {actions.map((action) => (
        <Pressable
          key={action.route}
          style={s.button}
          onPress={() => router.push(action.route as never)}
        >
          <Text style={s.buttonText}>{action.label}  →</Text>
        </Pressable>
      ))}
      <View style={s.note}>
        <Text style={s.noteText}>
          PREVIEW MODE  ·  Some actions need the Lumina Laundry API
        </Text>
      </View>
      <Pressable style={s.back} onPress={() => router.back()}>
        <Text style={s.backText}>Back</Text>
      </Pressable>
    </ScrollView>
  );
}

function createStyles(colors: AppThemeColors) {
  return StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingTop: 28, paddingBottom: 35, gap: 14 },
  eyebrow: {
    color: colors.primaryStrong,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 2,
  },
  title: { color: colors.text, fontSize: 30, fontWeight: "900" },
  description: {
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 23,
    marginBottom: 4,
  },
  card: {
    backgroundColor: colors.backgroundElement,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 7,
  },
  form: {
    backgroundColor: colors.backgroundElement,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  field: { gap: 6 },
  label: { color: colors.text, fontSize: 12, fontWeight: "800" },
  input: {
    backgroundColor: colors.input,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 13,
    paddingVertical: 12,
    color: colors.text,
    fontSize: 14,
  },
  multiline: { minHeight: 90, textAlignVertical: "top" },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "800",
    flex: 1,
  },
  chevron: { fontSize: 22, color: colors.primaryStrong, paddingLeft: 12 },
  body: { color: colors.textSecondary, fontSize: 13, lineHeight: 20, marginTop: 6 },
  button: {
    backgroundColor: colors.primaryStrong,
    borderRadius: 13,
    padding: 15,
    alignItems: "center",
  },
  disabled: { opacity: 0.55 },
  buttonText: { color: "#FFFDFA", fontWeight: "800" },
  note: { backgroundColor: colors.backgroundSelected, borderRadius: 11, padding: 12, marginTop: 2 },
  noteText: {
    color: colors.textSecondary,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.5,
    textAlign: "center",
  },
  back: { padding: 12, alignItems: "center" },
  backText: { color: colors.primaryStrong, fontWeight: "800" },
  });
}
