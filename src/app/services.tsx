import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { fetchServices, type CatalogService } from "@/lib/laundry-api";
import { useThemedStyles } from "@/hooks/use-themed-styles";
import { LuminaLogo } from "@/components/brand-ui";

const ICONS = ["◉", "✧", "≋", "◇", "▱"];
type CartItem = { id: string; service_item_id: number; variant_id: number | null; vendor_id: number; name: string; price: number; quantity: number; unit: string };

export default function ServicesScreen() {
  const styles = useThemedStyles(baseStyles);
  const [services, setServices] = useState<CatalogService[]>([]);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [catalog, saved] = await Promise.all([
        fetchServices(),
        AsyncStorage.getItem("lumina_favorites"),
      ]);
      setServices(catalog);
      try {
        const parsed: unknown = saved ? JSON.parse(saved) : [];
        setFavorites(Array.isArray(parsed) ? parsed.filter((id): id is number => typeof id === "number") : []);
      } catch {
        setFavorites([]);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The service catalogue could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const categories = useMemo(() => ["All", ...Array.from(new Set(services.map((item) => item.category).filter((value): value is string => Boolean(value))))], [services]);
  const visible = useMemo(() => services.filter((item) =>
    (category === "All" || item.category === category) &&
    `${item.name} ${item.description ?? ""} ${item.vendor_name ?? ""}`.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase())
  ), [category, search, services]);

  const toggleFavorite = async (service: CatalogService) => {
    const next = favorites.includes(service.id) ? favorites.filter((id) => id !== service.id) : [...favorites, service.id];
    setFavorites(next);
    try { await AsyncStorage.setItem("lumina_favorites", JSON.stringify(next)); }
    catch { setFeedback("Could not save this favourite. Please try again."); }
  };

  const addToCart = async (service: CatalogService) => {
    try {
      const raw = await AsyncStorage.getItem("lumina_cart");
      const cart: CartItem[] = raw ? JSON.parse(raw) as CartItem[] : [];
      if (cart.some((item) => item.vendor_id !== service.vendor_id)) throw new Error("Your bag can contain services from one shop at a time. Clear it before switching shops.");
      const variant = service.variants[0] ?? null;
      const id = `${service.id}-${variant?.id ?? "base"}`;
      const existing = cart.find((item) => item.id === id);
      if (existing) existing.quantity = Math.min(50, existing.quantity + 1);
      else cart.push({ id, service_item_id: service.id, variant_id: variant?.id ?? null, vendor_id: service.vendor_id, name: variant ? `${service.name} - ${variant.name}` : service.name, price: variant?.price ?? service.price, quantity: 1, unit: "item" });
      await AsyncStorage.setItem("lumina_cart", JSON.stringify(cart));
      setFeedback(`${service.name} added to your bag. No booking has been placed.`);
    } catch (cause) {
      setFeedback(cause instanceof Error ? cause.message : "Could not update your bag. Please try again.");
    }
  };

  return <SafeAreaView style={styles.safeArea} edges={["top"]}>
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.header}><LuminaLogo height={32} /><Pressable accessibilityRole="button" onPress={() => router.push("/cart")} style={styles.cartButton}><Text style={styles.cartText}>Cart  →</Text></Pressable></View>
      <Text style={styles.eyebrow}>PREMIUM GARMENT CARE</Text>
      <Text style={styles.title}>Choose a service</Text>
      <Text style={styles.subtitle}>Browse care services from participating local shops.</Text>
      <TextInput value={search} onChangeText={setSearch} placeholder="Search laundry services" placeholderTextColor="#4B5B50" style={styles.search} accessibilityLabel="Search services" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>{categories.map((item) => <Pressable key={item} accessibilityRole="button" accessibilityState={{ selected: category === item }} onPress={() => setCategory(item)} style={[styles.filter, category === item && styles.filterActive]}><Text style={[styles.filterText, category === item && styles.filterTextActive]}>{item}</Text></Pressable>)}</ScrollView>
      {!!feedback && <View style={styles.cartFeedback}><Text style={styles.cartFeedbackText}>{feedback}</Text><Pressable accessibilityRole="button" onPress={() => router.push("/cart")}><Text style={styles.cartFeedbackLink}>Open bag  →</Text></Pressable></View>}
      <View style={styles.banner}><Text style={styles.bannerTitle}>Laundry, made simple.</Text><Text style={styles.bannerText}>Review the shop and options before adding a service to your bag.</Text></View>
      {loading && <View style={styles.state}><ActivityIndicator color="#245A45" /><Text style={styles.description}>Loading services…</Text></View>}
      {!loading && !!error && <View style={styles.stateCard}><Text style={styles.cardTitle}>Services are unavailable</Text><Text style={styles.description}>{error}</Text><Pressable accessibilityRole="button" onPress={() => void load()} style={styles.retry}><Text style={styles.addButtonText}>Try again</Text></Pressable></View>}
      {!loading && !error && visible.length === 0 && <View style={styles.noResults}><Text style={styles.cardTitle}>{services.length ? "No matching services" : "No services available yet"}</Text><Text style={styles.description}>{services.length ? "Try another search or category." : "Check back later for services from participating shops."}</Text></View>}
      {visible.map((service, index) => <View key={service.id} style={styles.card}>
        <Pressable accessibilityRole="button" accessibilityLabel={`View ${service.name} details`} onPress={() => router.push({ pathname: "/service-details", params: { id: String(service.id) } })} style={styles.iconBox}><Text style={styles.icon}>{ICONS[index % ICONS.length]}</Text></Pressable>
        <View style={styles.cardBody}><Pressable accessibilityRole="button" onPress={() => router.push({ pathname: "/service-details", params: { id: String(service.id) } })}><Text style={styles.cardTitle}>{service.name}</Text></Pressable><Text style={styles.description}>{service.description || "Care service from a participating local shop."}</Text><Text style={styles.price}>From ₹{service.price.toLocaleString("en-IN")}</Text><Text style={styles.vendor}>{service.vendor_name || "Participating local shop"}</Text><Pressable accessibilityRole="button" style={styles.addButton} onPress={() => void addToCart(service)}><Text style={styles.addButtonText}>Add to bag  +</Text></Pressable></View>
        <Pressable accessibilityRole="button" accessibilityLabel={favorites.includes(service.id) ? `Remove ${service.name} from favourites` : `Save ${service.name} to favourites`} accessibilityState={{ selected: favorites.includes(service.id) }} onPress={() => void toggleFavorite(service)}><Text style={[styles.heart, favorites.includes(service.id) && styles.heartActive]}>{favorites.includes(service.id) ? "♥" : "♡"}</Text></Pressable>
      </View>)}
      <View style={styles.info}><Text style={styles.infoTitle}>Catalogue information</Text><Text style={styles.infoText}>Prices and availability come from the configured service catalogue. Adding a service to your bag does not place an order or collect payment.</Text></View>
    </ScrollView>
  </SafeAreaView>;
}

const baseStyles = StyleSheet.create({
  safeArea:{flex:1,backgroundColor:"#F7F5F0"},content:{padding:22,paddingBottom:34},header:{flexDirection:"row",alignItems:"center",justifyContent:"space-between"},brand:{color:"#245A45",fontSize:23,letterSpacing:3,fontFamily:"serif"},caption:{color:"#4B5B50",fontSize:9,letterSpacing:2,marginTop:3},cartButton:{backgroundColor:"#E3EEE6",paddingHorizontal:14,paddingVertical:11,borderRadius:12},cartText:{color:"#245A45",fontSize:12,fontWeight:"800"},eyebrow:{color:"#245A45",fontSize:10,fontWeight:"900",letterSpacing:1.5,marginTop:25},title:{color:"#1D3028",fontSize:32,fontWeight:"700",fontFamily:"serif",marginTop:7},subtitle:{color:"#4B5B50",fontSize:13,lineHeight:20,marginTop:8},search:{backgroundColor:"#FFFDFA",borderWidth:1,borderColor:"#CDD8CE",borderRadius:12,padding:13,color:"#1D3028",fontSize:13,marginTop:17},filters:{flexDirection:"row",gap:8,marginTop:12,paddingRight:20},filter:{borderWidth:1,borderColor:"#CDD8CE",borderRadius:20,paddingHorizontal:13,paddingVertical:9},filterActive:{backgroundColor:"#1D3028",borderColor:"#1D3028"},filterText:{color:"#1D3028",fontSize:11,fontWeight:"700"},filterTextActive:{color:"#FFFDFA"},cartFeedback:{backgroundColor:"#E3EEE6",borderRadius:12,padding:13,marginTop:13,flexDirection:"row",alignItems:"center",justifyContent:"space-between",gap:12},cartFeedbackText:{flex:1,color:"#1D3028",fontSize:12,fontWeight:"700"},cartFeedbackLink:{color:"#245A45",fontSize:11,fontWeight:"800"},banner:{backgroundColor:"#E3EEE6",borderRadius:18,padding:20,marginTop:20,marginBottom:16},bannerTitle:{color:"#1D3028",fontSize:21,fontWeight:"700",fontFamily:"serif"},bannerText:{color:"#4B5B50",fontSize:13,lineHeight:19,marginTop:6},state:{alignItems:"center",gap:8,padding:25},stateCard:{backgroundColor:"#FFFDFA",borderRadius:14,padding:18,marginTop:8,gap:8},card:{backgroundColor:"#FFFDFA",borderRadius:16,borderWidth:1,borderColor:"#CDD8CE",padding:15,marginBottom:12,flexDirection:"row",alignItems:"flex-start"},iconBox:{width:48,height:48,borderRadius:14,backgroundColor:"#E3EEE6",alignItems:"center",justifyContent:"center"},icon:{fontSize:25,color:"#245A45"},cardBody:{flex:1,marginLeft:13,marginRight:8},cardTitle:{color:"#1D3028",fontSize:15,fontWeight:"700"},description:{color:"#4B5B50",fontSize:11,lineHeight:16,marginTop:5},price:{color:"#245A45",fontSize:11,fontWeight:"700",marginTop:8},vendor:{color:"#4B5B50",fontSize:10,marginTop:4},addButton:{alignSelf:"flex-start",backgroundColor:"#245A45",borderRadius:9,paddingHorizontal:12,paddingVertical:9,marginTop:10},addButtonText:{color:"#FFFDFA",fontSize:11,fontWeight:"800"},retry:{alignSelf:"flex-start",borderRadius:9,backgroundColor:"#245A45",paddingHorizontal:14,paddingVertical:10,marginTop:4},heart:{color:"#4B5B50",fontSize:22,padding:3},heartActive:{color:"#A93226"},noResults:{backgroundColor:"#FFFDFA",borderRadius:14,padding:18,marginTop:8},info:{backgroundColor:"#1D3028",borderRadius:16,padding:17,marginTop:8},infoTitle:{color:"#FFFDFA",fontSize:14,fontWeight:"800"},infoText:{color:"#E3EEE6",fontSize:12,lineHeight:18,marginTop:7}
});
