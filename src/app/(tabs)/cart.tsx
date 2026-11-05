import React, { useMemo, useState } from "react";
import { Alert, ScrollView, Text, TextInput, View } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { C, Card, EmptyState, Heading, PrimaryButton, Screen } from "../../components/customer-ui";
import { CartLine, formatINR, LaundryService } from "../../lib/customer-panel";

export default function CartScreen() {
  const params = useLocalSearchParams<{ selection?: string }>();
  const [address, setAddress] = useState("");
  const [pickupDate, setPickupDate] = useState("");
  const [pickupSlot, setPickupSlot] = useState("");
  const [lines, setLines] = useState<CartLine[]>(() => {
    try { return params.selection ? JSON.parse(params.selection) : []; } catch { return []; }
  });
  const subtotal = useMemo(() => lines.reduce((sum, x) => sum + x.service.price * x.quantity, 0), [lines]);
  const change = (id: string, delta: number) => setLines(old => old.map(x => x.service.id === id ? { ...x, quantity: x.quantity + delta } : x).filter(x => x.quantity > 0));
  const checkout = () => {
    if (!lines.length) return Alert.alert("Cart is empty", "Add a service before checkout.");
    if (!address.trim() || !pickupDate.trim() || !pickupSlot.trim()) return Alert.alert("Details required", "Enter your pickup address, date and time slot.");
    Alert.alert("Ready for API integration", "The form is validated, but this patch does not submit a real booking. Connect the verified Laravel booking endpoint before accepting orders.");
  };
  return <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: 18, gap: 16, paddingBottom: 30 }}>
    <Heading title="Your cart" subtitle="Review your services and pickup details." />
    {!lines.length ? <><EmptyState title="Your cart is empty" body="Choose a laundry service to start a booking." /><PrimaryButton title="Browse services" onPress={() => router.push("/services" as never)} /></> : <>
      {lines.map(x => <Card key={x.service.id}>
        <Text style={{ color: C.ink, fontWeight: "800", fontSize: 15 }}>{x.service.name}</Text>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Text style={{ color: C.muted }}>{formatINR(x.service.price)} × {x.quantity}</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <Text onPress={() => change(x.service.id, -1)} style={stepper}>−</Text>
            <Text style={{ color: C.ink, fontWeight: "800" }}>{x.quantity}</Text>
            <Text onPress={() => change(x.service.id, 1)} style={stepper}>+</Text>
          </View>
        </View>
        <Text style={{ color: C.brand, fontWeight: "900" }}>{formatINR(x.service.price * x.quantity)}</Text>
      </Card>)}
      <Card>
        <Text style={{ color: C.ink, fontSize: 18, fontWeight: "900" }}>Pickup details</Text>
        <Text style={label}>Full pickup address</Text>
        <TextInput value={address} onChangeText={setAddress} placeholder="House, street, area, city" style={input} />
        <Text style={label}>Pickup date (YYYY-MM-DD)</Text>
        <TextInput value={pickupDate} onChangeText={setPickupDate} placeholder="2026-11-05" style={input} />
        <Text style={label}>Available time slot</Text>
        <TextInput value={pickupSlot} onChangeText={setPickupSlot} placeholder="Choose from live API slots" style={input} />
        <Text style={{ color: C.muted, fontSize: 12 }}>Production version should load saved addresses and available pickup slots from Laravel, rather than accept free text.</Text>
      </Card>
      <Card style={{ gap: 8 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}><Text style={{ color: C.muted }}>Subtotal</Text><Text style={{ color: C.ink, fontWeight: "700" }}>{formatINR(subtotal)}</Text></View>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}><Text style={{ color: C.muted }}>Taxes / pickup fee</Text><Text style={{ color: C.muted }}>Calculated by server</Text></View>
        <View style={{ height: 1, backgroundColor: C.border, marginVertical: 4 }} />
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}><Text style={{ color: C.ink, fontSize: 16, fontWeight: "900" }}>Estimated subtotal</Text><Text style={{ color: C.brand, fontSize: 18, fontWeight: "900" }}>{formatINR(subtotal)}</Text></View>
        <PrimaryButton title="Validate booking details" onPress={checkout} />
      </Card>
    </>}
  </ScrollView>;
}
const label = { color: C.ink, fontSize: 12, fontWeight: "800" as const, marginTop: 3 };
const input = { borderWidth: 1, borderColor: C.border, borderRadius: 11, padding: 12, color: C.ink, backgroundColor: "#FAFCFD" };
const stepper = { fontSize: 22, color: C.brand, fontWeight: "900" as const, paddingHorizontal: 5 };
