import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useAppTheme } from "@/providers/app-theme-provider";

type RecordItem = { id: string; title: string; detail: string; status: string; createdAt: string };
type Props = { title: string; subtitle: string; storageKey: string; fields: string[]; icon: string };
function isRecord(value: unknown): value is RecordItem {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return ["id", "title", "detail", "status", "createdAt"].every((key) => typeof item[key] === "string");
}

export default function VendorFeaturePage({ title, subtitle, storageKey, fields, icon }: Props) {
  const { colors } = useAppTheme();
  const [items, setItems] = useState<RecordItem[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(storageKey);
      const parsed: unknown = raw ? JSON.parse(raw) : [];
      setItems(Array.isArray(parsed) && parsed.every(isRecord) ? parsed : []);
    } catch {
      setItems([]);
    } finally {
      setLoaded(true);
    }
  }, [storageKey]);

  useEffect(() => { void Promise.resolve().then(load); }, [load]);

  const visibleItems = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return items.filter((item) => !normalized || `${item.title} ${item.detail}`.toLowerCase().includes(normalized));
  }, [items, query]);

  const persist = async (next: RecordItem[]) => {
    await AsyncStorage.setItem(storageKey, JSON.stringify(next));
    setItems(next);
  };

  const reset = () => { setValues({}); setEditingId(null); };
  const save = async () => {
    const titleValue = values[fields[0]]?.trim();
    if (!titleValue) { Alert.alert("Required", `Enter ${fields[0]}.`); return; }
    const detail = fields.slice(1).map((field) => values[field]?.trim() ? `${field}: ${values[field].trim()}` : "").filter(Boolean).join("\n");
    const existing = items.find((item) => item.id === editingId);
    const record: RecordItem = { id: existing?.id ?? `${Date.now()}`, title: titleValue, detail, status: existing?.status ?? "Active", createdAt: existing?.createdAt ?? new Date().toISOString() };
    await persist(existing ? items.map((item) => item.id === existing.id ? record : item) : [record, ...items]);
    reset();
  };

  const edit = (item: RecordItem) => {
    const next: Record<string, string> = { [fields[0]]: item.title };
    fields.slice(1).forEach((field) => {
      const line = item.detail.split("\n").find((value) => value.startsWith(`${field}: `));
      if (line) next[field] = line.slice(field.length + 2);
    });
    setValues(next); setEditingId(item.id);
  };

  const remove = (item: RecordItem) => Alert.alert("Remove entry?", item.title, [
    { text: "Keep", style: "cancel" },
    { text: "Remove", style: "destructive", onPress: () => void persist(items.filter((value) => value.id !== item.id)) },
  ]);

  const s = styles(colors);
  return (
    <ScrollView style={s.page} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <View style={s.topRow}><Pressable onPress={() => router.back()}><Text style={s.back}>← Partner workspace</Text></Pressable><Text style={s.icon}>{icon}</Text></View>
      <View style={s.hero}><Text style={s.eyebrow}>PARTNER WORKSPACE</Text><Text style={s.title}>{title}</Text><Text style={s.subtitle}>{subtitle}</Text><View style={s.heroMeta}><Text style={s.heroMetaText}>{items.length} saved</Text><Text style={s.heroMetaText}>·</Text><Text style={s.heroMetaText}>Preview mode</Text></View></View>
      <View style={s.notice}><Text style={s.noticeTitle}>Operations preview</Text><Text style={s.noticeText}>Entries are saved on this device until the live partner API is connected.</Text></View>
      <View style={s.card}><Text style={s.sectionTitle}>{editingId ? "Edit entry" : "Add new entry"}</Text>{fields.map((field) => { const multiline = /notes|description|address/i.test(field); return <View key={field} style={s.field}><Text style={s.label}>{field}</Text><TextInput value={values[field] ?? ""} onChangeText={(value) => setValues((current) => ({ ...current, [field]: value }))} placeholder={`Enter ${field.toLowerCase()}`} placeholderTextColor={colors.textSecondary} multiline={multiline} textAlignVertical={multiline ? "top" : "center"} style={[s.input, multiline && s.multiline]} /></View>; })}<Pressable onPress={() => void save()} style={s.primary}><Text style={s.primaryText}>{editingId ? "Save changes" : "Add to workspace"}</Text></Pressable>{editingId && <Pressable onPress={reset} style={s.cancel}><Text style={s.cancelText}>Cancel editing</Text></Pressable>}</View>
      <View style={s.sectionRow}><Text style={s.sectionTitle}>Your {title.toLowerCase()}</Text><Text style={s.count}>{visibleItems.length} shown</Text></View>
      <TextInput value={query} onChangeText={setQuery} placeholder="Search entries" placeholderTextColor={colors.textSecondary} style={s.input} />
      {!loaded ? <View style={s.empty}><Text style={s.detail}>Loading workspace…</Text></View> : visibleItems.length === 0 ? <View style={s.empty}><Text style={s.emptyTitle}>Nothing here yet</Text><Text style={s.detail}>Add your first entry above to start organizing this section.</Text></View> : visibleItems.map((item) => <View key={item.id} style={s.item}><View style={s.itemTop}><Text style={s.itemTitle}>{item.title}</Text><Text style={s.status}>{item.status}</Text></View>{!!item.detail && <Text style={s.detail}>{item.detail}</Text>}<Text style={s.date}>{new Date(item.createdAt).toLocaleDateString()}</Text><View style={s.actions}><Pressable onPress={() => edit(item)} style={s.secondary}><Text style={s.secondaryText}>Edit</Text></Pressable><Pressable onPress={() => remove(item)} style={s.delete}><Text style={s.deleteText}>Remove</Text></Pressable></View></View>)}
      <Text style={s.footer}>LUMINA PARTNER PORTAL · LOCAL PREVIEW</Text>
    </ScrollView>
  );
}

function styles(colors: ReturnType<typeof useAppTheme>["colors"]) {
  return StyleSheet.create({
    page: { flex: 1, backgroundColor: colors.background }, content: { padding: 20, paddingBottom: 44, gap: 14 }, topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingTop: 8 }, back: { color: colors.primary, fontWeight: "800", fontSize: 12 }, icon: { fontSize: 28, color: colors.gold }, hero: { backgroundColor: colors.primaryStrong, borderRadius: 24, padding: 21, gap: 7 }, eyebrow: { color: "#FFFDFA", fontSize: 10, fontWeight: "900", letterSpacing: 1.8 }, title: { color: "#FFFDFA", fontSize: 29, fontWeight: "900", marginTop: 4 }, subtitle: { color: "#EAF3ED", fontSize: 13, lineHeight: 19 }, heroMeta: { flexDirection: "row", gap: 8, marginTop: 6 }, heroMetaText: { color: "#CFE7D8", fontSize: 11, fontWeight: "800" }, notice: { backgroundColor: colors.accentSoft, borderRadius: 15, padding: 14 }, noticeTitle: { color: colors.primaryStrong, fontSize: 12, fontWeight: "900" }, noticeText: { color: colors.textSecondary, fontSize: 11, lineHeight: 16, marginTop: 4 }, card: { backgroundColor: colors.backgroundElement, borderColor: colors.border, borderWidth: 1, borderRadius: 19, padding: 16, gap: 11 }, sectionTitle: { color: colors.text, fontSize: 18, fontWeight: "900" }, field: { gap: 5 }, label: { color: colors.text, fontSize: 11, fontWeight: "800" }, input: { minHeight: 46, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.input, color: colors.text, paddingHorizontal: 13, paddingVertical: 11, fontSize: 13 }, multiline: { minHeight: 82, textAlignVertical: "top" }, primary: { minHeight: 50, borderRadius: 13, backgroundColor: colors.primaryStrong, alignItems: "center", justifyContent: "center", marginTop: 2 }, primaryText: { color: colors.onPrimary, fontSize: 13, fontWeight: "900" }, cancel: { alignItems: "center", padding: 3 }, cancelText: { color: colors.primary, fontWeight: "800", fontSize: 12 }, sectionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4 }, count: { color: colors.textSecondary, fontSize: 11, fontWeight: "800" }, empty: { backgroundColor: colors.backgroundElement, borderColor: colors.border, borderWidth: 1, borderRadius: 17, padding: 20, alignItems: "center" }, emptyTitle: { color: colors.text, fontSize: 16, fontWeight: "900" }, detail: { color: colors.textSecondary, fontSize: 12, lineHeight: 18, marginTop: 5 }, item: { backgroundColor: colors.backgroundElement, borderColor: colors.border, borderWidth: 1, borderRadius: 17, padding: 15, gap: 7 }, itemTop: { flexDirection: "row", justifyContent: "space-between", gap: 10 }, itemTitle: { flex: 1, color: colors.text, fontSize: 15, fontWeight: "900" }, status: { color: colors.primary, fontSize: 11, fontWeight: "900" }, date: { color: colors.textSecondary, fontSize: 10, marginTop: 2 }, actions: { flexDirection: "row", gap: 9, marginTop: 5 }, secondary: { backgroundColor: colors.accentSoft, paddingVertical: 9, paddingHorizontal: 14, borderRadius: 9 }, secondaryText: { color: colors.primaryStrong, fontWeight: "900", fontSize: 11 }, delete: { borderColor: colors.border, borderWidth: 1, paddingVertical: 9, paddingHorizontal: 14, borderRadius: 9 }, deleteText: { color: colors.danger, fontWeight: "900", fontSize: 11 }, footer: { color: colors.textSecondary, textAlign: "center", fontSize: 9, fontWeight: "800", letterSpacing: 1.1, marginTop: 4 },
  });
}
