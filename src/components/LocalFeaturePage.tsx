import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type { AppThemeColors } from "@/constants/theme";
import { useAppTheme } from "@/providers/app-theme-provider";

type RecordItem = {
  id: string;
  title: string;
  detail: string;
  status: string;
  createdAt: string;
};

type Props = {
  title: string;
  subtitle?: string;
  storageKey: string;
  fields: string[];
};

const STATUSES = [
  "Pending",
  "Confirmed",
  "In Progress",
  "Completed",
  "Delivered",
  "Cancelled",
];
const FILTERS = ["All", ...STATUSES];

function isRecordItem(value: unknown): value is RecordItem {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.id === "string" &&
    typeof item.title === "string" &&
    typeof item.detail === "string" &&
    typeof item.status === "string" &&
    typeof item.createdAt === "string"
  );
}

export default function LocalFeaturePage({
  title,
  subtitle = "Manage records in this on-device preview. API sync is not connected.",
  storageKey,
  fields,
}: Props) {
  const { colors } = useAppTheme();
  const s = createStyles(colors);
  const [items, setItems] = useState<RecordItem[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [storageError, setStorageError] = useState<string | null>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(storageKey)
      .then((raw) => {
        if (!active) return;
        if (raw) {
          const parsed: unknown = JSON.parse(raw);
          if (!Array.isArray(parsed) || !parsed.every(isRecordItem)) {
            throw new Error("Saved records have an unexpected format.");
          }
          setItems(parsed);
        } else {
          setItems([]);
        }
      })
      .catch((error: unknown) => {
        if (!active) return;
        setItems([]);
        setStorageError(
          error instanceof Error
            ? error.message
            : "Saved records could not be loaded.",
        );
      })
      .finally(() => {
        if (active) setReady(true);
      });

    return () => {
      active = false;
    };
  }, [storageKey, loadAttempt]);

  const persist = useCallback(
    async (next: RecordItem[]) => {
      try {
        await AsyncStorage.setItem(storageKey, JSON.stringify(next));
        setItems(next);
        setStorageError(null);
        return true;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Please try again.";
        setStorageError(`Records could not be saved. ${message}`);
        Alert.alert("Could not save records", message);
        return false;
      }
    },
    [storageKey],
  );

  const visibleItems = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return items.filter((item) => {
      const matchesStatus =
        statusFilter === "All" || item.status === statusFilter;
      const matchesQuery =
        !query ||
        `${item.title} ${item.detail} ${item.status}`
          .toLocaleLowerCase()
          .includes(query);
      return matchesStatus && matchesQuery;
    });
  }, [items, search, statusFilter]);

  const resetForm = () => {
    setValues({});
    setEditingId(null);
  };

  const retryLoading = () => {
    setReady(false);
    setStorageError(null);
    setLoadAttempt((attempt) => attempt + 1);
  };

  const save = async () => {
    const titleValue = (values[fields[0]] || "").trim();
    if (!titleValue) {
      Alert.alert("Required", `Enter ${fields[0]}.`);
      return;
    }

    const detail = fields
      .slice(1)
      .map((field) => {
        const value = values[field]?.trim();
        return value ? `${field}: ${value}` : "";
      })
      .filter(Boolean)
      .join("\n");
    const existing = items.find((item) => item.id === editingId);
    const record: RecordItem = {
      id: existing?.id ?? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title: titleValue,
      detail,
      status: existing?.status ?? "Pending",
      createdAt: existing?.createdAt ?? new Date().toISOString(),
    };
    const next = existing
      ? items.map((item) => (item.id === existing.id ? record : item))
      : [record, ...items];

    if (await persist(next)) resetForm();
  };

  const edit = (item: RecordItem) => {
    const recordValues: Record<string, string> = {
      [fields[0]]: item.title,
    };
    for (const field of fields.slice(1)) {
      const prefix = `${field}: `;
      const line = item.detail.split("\n").find((value) => value.startsWith(prefix));
      if (line) recordValues[field] = line.slice(prefix.length);
    }
    setValues(recordValues);
    setEditingId(item.id);
  };

  const updateStatus = (item: RecordItem) => {
    Alert.alert("Update status", item.title, [
      ...STATUSES.map((status) => ({
        text: status,
        onPress: () => {
          const next = items.map((record) =>
            record.id === item.id ? { ...record, status } : record,
          );
          void persist(next);
        },
      })),
      { text: "Close", style: "cancel" },
    ]);
  };

  const remove = (item: RecordItem) => {
    Alert.alert("Delete record?", item.title, [
      { text: "Keep", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          void persist(items.filter((record) => record.id !== item.id));
        },
      },
    ]);
  };

  return (
    <ScrollView
      style={s.page}
      contentContainerStyle={s.content}
      keyboardShouldPersistTaps="handled"
    >
      <View style={s.hero}>
        <Text style={s.eyebrow}>LUMINA LAUNDRY</Text>
        <Text style={s.title}>{title}</Text>
        <Text style={s.subtitle}>{subtitle}</Text>
        <Text style={s.count}>
          {items.length} {items.length === 1 ? "record" : "records"}
        </Text>
      </View>

      {!!storageError && (
        <View style={s.errorCard}>
          <Text style={s.errorTitle}>Local storage needs attention</Text>
          <Text style={s.errorText}>{storageError}</Text>
          <Pressable
            accessibilityRole="button"
            onPress={retryLoading}
          >
            <Text style={s.retry}>Try again</Text>
          </Pressable>
        </View>
      )}

      <View style={s.card}>
        <Text style={s.section}>{editingId ? "Edit record" : "Add record"}</Text>
        {fields.map((field) => (
          <View key={field} style={s.field}>
            <Text style={s.label}>{field}</Text>
            <TextInput
              value={values[field] || ""}
              onChangeText={(value) =>
                setValues((old) => ({ ...old, [field]: value }))
              }
              placeholder={`Enter ${field.toLowerCase()}`}
              placeholderTextColor="#4B5B50"
              style={[
                s.input,
                /address|message|notes|description/i.test(field) &&
                  s.multiline,
              ]}
              multiline={/address|message|notes|description/i.test(field)}
              textAlignVertical={
                /address|message|notes|description/i.test(field)
                  ? "top"
                  : "center"
              }
            />
          </View>
        ))}
        <Pressable
          disabled={!ready || !!storageError}
          style={[s.primary, (!ready || !!storageError) && s.disabled]}
          onPress={() => void save()}
        >
          <Text style={s.primaryText}>
            {editingId ? "Save changes" : "Save record"}
          </Text>
        </Pressable>
        {!!editingId && (
          <Pressable style={s.cancel} onPress={resetForm}>
            <Text style={s.cancelText}>Cancel editing</Text>
          </Pressable>
        )}
      </View>

      <View style={s.recordsHeading}>
        <Text style={s.section}>Records</Text>
        <Text style={s.recordCount}>{visibleItems.length} shown</Text>
      </View>
      <TextInput
        value={search}
        onChangeText={setSearch}
        placeholder="Search records"
        placeholderTextColor="#4B5B50"
        style={s.input}
        accessibilityLabel="Search records"
      />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.filters}
      >
        {FILTERS.map((filter) => (
          <Pressable
            key={filter}
            onPress={() => setStatusFilter(filter)}
            accessibilityRole="button"
            accessibilityState={{ selected: statusFilter === filter }}
            style={[s.filter, statusFilter === filter && s.filterActive]}
          >
            <Text
              style={[
                s.filterText,
                statusFilter === filter && s.filterTextActive,
              ]}
            >
              {filter}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {!ready ? (
        <View style={s.card}>
          <Text style={s.detail}>Loading saved records…</Text>
        </View>
      ) : visibleItems.length === 0 ? (
        <View style={s.card}>
          <Text style={s.itemTitle}>
            {items.length ? "No matching records" : "Nothing saved yet"}
          </Text>
          <Text style={s.detail}>
            {items.length
              ? "Try another search or status filter."
              : "Add a record above to see it here."}
          </Text>
        </View>
      ) : (
        visibleItems.map((item) => (
          <View key={item.id} style={s.card}>
            <View style={s.recordHeader}>
              <Text style={s.itemTitle}>{item.title}</Text>
              <Pressable
                onPress={() => updateStatus(item)}
                accessibilityRole="button"
                accessibilityLabel={`Change ${item.title} status`}
              >
                <Text style={s.status}>{item.status}  ▾</Text>
              </Pressable>
            </View>
            {!!item.detail && <Text style={s.detail}>{item.detail}</Text>}
            <Text style={s.date}>
              {new Date(item.createdAt).toLocaleString()}
            </Text>
            <View style={s.actions}>
              <Pressable style={s.secondary} onPress={() => edit(item)}>
                <Text style={s.secondaryText}>Edit</Text>
              </Pressable>
              <Pressable style={s.delete} onPress={() => remove(item)}>
                <Text style={s.deleteText}>Delete</Text>
              </Pressable>
            </View>
          </View>
        ))
      )}
      <Text style={s.footer}>
        PREVIEW MODE · SAVED ON THIS DEVICE · NO API CONNECTION
      </Text>
    </ScrollView>
  );
}

function createStyles(colors: AppThemeColors) {
  return StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 35, gap: 13 },
  hero: { backgroundColor: colors.primaryStrong, borderRadius: 22, padding: 22, gap: 7 },
  eyebrow: {
    color: "#FFFDFA",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 2,
  },
  title: { color: "#FFFDFA", fontSize: 27, fontWeight: "900" },
  subtitle: { color: "#FFFDFA", fontSize: 13, lineHeight: 19 },
  count: { color: "#FFFDFA", fontWeight: "800", marginTop: 5 },
  card: {
    backgroundColor: colors.backgroundElement,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
  },
  section: { color: colors.text, fontSize: 18, fontWeight: "900" },
  field: { gap: 5 },
  label: { color: colors.text, fontWeight: "700", fontSize: 12 },
  input: {
    backgroundColor: colors.input,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 11,
    padding: 12,
    color: colors.text,
    minHeight: 44,
  },
  multiline: { minHeight: 80, textAlignVertical: "top" },
  primary: {
    backgroundColor: colors.primaryStrong,
    borderRadius: 11,
    padding: 14,
    alignItems: "center",
  },
  disabled: { opacity: 0.5 },
  primaryText: { color: "#FFFDFA", fontWeight: "800" },
  cancel: { alignItems: "center", padding: 8 },
  cancelText: { color: colors.primary, fontWeight: "700" },
  recordsHeading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 3,
  },
  recordCount: { color: colors.textSecondary, fontSize: 12, fontWeight: "700" },
  filters: { gap: 8, paddingVertical: 1 },
  filter: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.backgroundElement,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  filterActive: { backgroundColor: colors.primaryStrong, borderColor: colors.primaryStrong },
  filterText: { color: colors.textSecondary, fontSize: 11, fontWeight: "700" },
  filterTextActive: { color: "#FFFDFA" },
  recordHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8,
  },
  itemTitle: { color: colors.text, fontSize: 16, fontWeight: "900", flex: 1 },
  status: { color: colors.primaryStrong, fontWeight: "800", fontSize: 12 },
  detail: { color: colors.textSecondary, lineHeight: 19, fontSize: 13 },
  date: { color: colors.textSecondary, fontSize: 10 },
  actions: { flexDirection: "row", gap: 9, flexWrap: "wrap" },
  secondary: { backgroundColor: colors.accentSoft, padding: 10, borderRadius: 9 },
  secondaryText: { color: colors.primaryStrong, fontWeight: "800", fontSize: 12 },
  delete: { borderWidth: 1, borderColor: "#E8D4D2", padding: 10, borderRadius: 9 },
  deleteText: { color: "#A94442", fontWeight: "800", fontSize: 12 },
  errorCard: {
    backgroundColor: colors.dangerBackground,
    borderWidth: 1,
    borderColor: "#E8D4D2",
    borderRadius: 14,
    padding: 14,
    gap: 6,
  },
  errorTitle: { color: colors.danger, fontWeight: "800" },
  errorText: { color: colors.textSecondary, fontSize: 12, lineHeight: 18 },
  retry: { color: colors.danger, fontWeight: "800", paddingVertical: 5 },
  footer: {
    color: colors.textSecondary,
    textAlign: "center",
    fontSize: 10,
    marginTop: 8,
  },
  });
}
