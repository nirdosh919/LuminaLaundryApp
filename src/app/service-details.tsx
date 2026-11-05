import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { fetchServices, type CatalogService } from "@/lib/laundry-api";
import { useThemedStyles } from "@/hooks/use-themed-styles";

type CartItem = { id: string; service_item_id: number; variant_id: number | null; vendor_id: number; name: string; price: number; quantity: number; unit: string };

export default function ServiceDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const styles = useThemedStyles(baseStyles);
  const [service, setService] = useState<CatalogService | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [variantId, setVariantId] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    fetchServices().then((items) => {
      if (!active) return;
      const found = items.find((item) => String(item.id) === String(id));
      setService(found ?? null);
      setError(found ? "" : "This service is no longer available.");
      setVariantId(found?.variants[0]?.id ?? null);
    }).catch((cause: unknown) => {
      if (active) setError(cause instanceof Error ? cause.message : "Could not load service details.");
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  const selectedVariant = useMemo(() => service?.variants.find((item) => item.id === variantId) ?? null, [service, variantId]);
  const addToCart = async () => {
    if (!service) return;
    try {
      const raw = await AsyncStorage.getItem("lumina_cart");
      const cart: CartItem[] = raw ? JSON.parse(raw) as CartItem[] : [];
      if (cart.some((item) => item.vendor_id !== service.vendor_id)) throw new Error("Clear your bag before adding services from another shop.");
      const id = `${service.id}-${selectedVariant?.id ?? "base"}`;
      const existing = cart.find((item) => item.id === id);
      if (existing) existing.quantity = Math.min(50, existing.quantity + 1);
      else cart.push({ id, service_item_id: service.id, variant_id: selectedVariant?.id ?? null, vendor_id: service.vendor_id, name: selectedVariant ? `${service.name} - ${selectedVariant.name}` : service.name, price: selectedVariant?.price ?? service.price, quantity: 1, unit: "item" });
      await AsyncStorage.setItem("lumina_cart", JSON.stringify(cart));
      setFeedback("Added to your bag. No booking has been placed.");
    } catch (cause) { setFeedback(cause instanceof Error ? cause.message : "Could not update your bag. Please try again."); }
  };

  return <SafeAreaView style={styles.safe} edges={["top"]}><ScrollView contentContainerStyle={styles.content}>
    <Pressable accessibilityRole="button" onPress={() => router.back()}><Text style={styles.back}>←  Services</Text></Pressable>
    {loading ? <View style={styles.state}><ActivityIndicator color={styles.accent.color as string} /><Text style={styles.copy}>Loading service details…</Text></View> : error ? <View style={styles.panel}><Text style={styles.title}>Service unavailable</Text><Text style={styles.copy}>{error}</Text><Pressable onPress={() => router.replace("/services")}><Text style={styles.link}>Browse services →</Text></Pressable></View> : service ? <>
      <Text style={styles.eyebrow}>{service.category || "GARMENT CARE"}</Text><Text style={styles.title}>{service.name}</Text>
      <Text style={styles.copy}>{service.description || "Professional care from a participating local shop."}</Text>
      <View style={styles.panel}><Text style={styles.panelTitle}>Service details</Text><Text style={styles.copy}>From ₹{service.price.toLocaleString("en-IN")} per item</Text><Text style={styles.copy}>Shop: {service.vendor_name || "Participating local shop"}</Text><Pressable accessibilityRole="button" onPress={() => router.push({ pathname: "/store-details" as never, params: { id: String(service.vendor_id), name: service.vendor_name || "Participating local shop" } })}><Text style={styles.link}>View shop details →</Text></Pressable></View>
      {service.variants.length > 0 && <View style={styles.panel}><Text style={styles.panelTitle}>Choose an option</Text>{service.variants.map((variant) => <Pressable key={variant.id} accessibilityRole="radio" accessibilityState={{ checked: variant.id === variantId }} onPress={() => setVariantId(variant.id)} style={[styles.option, variant.id === variantId && styles.optionSelected]}><Text style={styles.copy}>{variant.name}</Text><Text style={styles.optionPrice}>₹{variant.price.toLocaleString("en-IN")}</Text></Pressable>)}</View>}
      {!!feedback && <Text style={styles.copy}>{feedback}</Text>}
      <Pressable accessibilityRole="button" onPress={() => void addToCart()} style={styles.primary}><Text style={styles.primaryText}>Add to bag · ₹{(selectedVariant?.price ?? service.price).toLocaleString("en-IN")}</Text></Pressable>
      <Pressable accessibilityRole="button" onPress={() => router.push("/cart")} style={styles.secondary}><Text style={styles.link}>Review your bag →</Text></Pressable>
      <Text style={styles.disclaimer}>Prices and availability are supplied by the configured service catalogue. Adding to bag does not place an order or collect payment.</Text>
    </> : null}
  </ScrollView></SafeAreaView>;
}

const baseStyles = StyleSheet.create({ safe:{flex:1,backgroundColor:"#F7F5F0"}, content:{padding:20,paddingBottom:40}, back:{color:"#245A45",fontSize:14,fontWeight:"700",paddingVertical:12}, eyebrow:{color:"#245A45",fontSize:10,fontWeight:"800",letterSpacing:1.8,marginTop:20}, title:{color:"#1D3028",fontSize:32,fontFamily:"serif",fontWeight:"700",marginTop:7}, copy:{color:"#4B5B50",fontSize:13,lineHeight:20,marginTop:8}, panel:{backgroundColor:"#FFFDFA",borderWidth:1,borderColor:"#CDD8CE",borderRadius:16,padding:16,marginTop:16}, panelTitle:{color:"#1D3028",fontSize:15,fontWeight:"800",marginBottom:5}, option:{flexDirection:"row",justifyContent:"space-between",alignItems:"center",borderWidth:1,borderColor:"#CDD8CE",borderRadius:11,padding:12,marginTop:8}, optionSelected:{borderColor:"#245A45",backgroundColor:"#E3EEE6"}, optionPrice:{color:"#245A45",fontSize:13,fontWeight:"800"}, primary:{backgroundColor:"#245A45",borderRadius:13,alignItems:"center",padding:15,marginTop:18}, primaryText:{color:"#FFFDFA",fontSize:13,fontWeight:"800"}, secondary:{alignItems:"center",padding:14}, link:{color:"#245A45",fontSize:12,fontWeight:"800",marginTop:12}, disclaimer:{color:"#4B5B50",fontSize:10,lineHeight:15,textAlign:"center",marginTop:10}, state:{alignItems:"center",padding:30}, accent:{color:"#245A45"} });
