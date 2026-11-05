import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { router, useFocusEffect, type RelativePathString } from "expo-router";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { fetchServices, type CatalogService as ApiCatalogService } from "@/lib/laundry-api";
import { addCatalogServiceToCart } from "@/lib/cart-storage";
import { BrandColors } from "@/constants/theme";
import { useThemedStyles } from "@/hooks/use-themed-styles";
import { PremiumBackdrop } from "@/components/premium-ui";
import { LuminaLogo } from "@/components/brand-ui";

const AQUA = BrandColors.forest, NAVY = BrandColors.ink;
const icons = ["◉", "✧", "≋", "◇", "▱"];
type CatalogService = ApiCatalogService;

export default function ServicesScreen() {
  const styles = useThemedStyles(baseStyles);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [services, setServices] = useState<CatalogService[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");
  const [cartFeedback, setCartFeedback] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const requestVersion = useRef(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 400);

    return () => clearTimeout(timer);
  }, [search]);

  const loadCatalogue = useCallback(async () => {
    const version = requestVersion.current + 1;
    requestVersion.current = version;
    setLoading(true);
    setApiError("");

    try {
      const result = await fetchServices(debouncedSearch);
      if (version !== requestVersion.current) return;
      setServices(result);
    } catch (error) {
      if (version !== requestVersion.current) return;
      setApiError(
        error instanceof Error ? error.message : "Could not load services.",
      );
    } finally {
      if (version === requestVersion.current) setLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadCatalogue();
    }, 0);

    return () => {
      clearTimeout(timer);
      requestVersion.current += 1;
    };
  }, [loadCatalogue]);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      const loadFavorites = async () => {
        try {
          const rawFavorites = await AsyncStorage.getItem("lumina_favorites");

          if (!active) return;

          try {
            const parsed: unknown = rawFavorites ? JSON.parse(rawFavorites) : [];
            setFavorites(
              Array.isArray(parsed)
                ? parsed.filter((item): item is string => typeof item === "string")
                : [],
            );
          } catch {
            setFavorites([]);
          }
        } catch { if (active) setFavorites([]);
        }
      };

      void loadFavorites();
      return () => {
        active = false;
      };
    }, []),
  );
  const handleAddToCart=async(service:CatalogService)=>{if(service.variants.length){router.push({pathname:"/service-details" as RelativePathString,params:{id:String(service.id)}});return;}try{await addCatalogServiceToCart(service,null);setCartFeedback(`${service.name} added to your bag.`);}catch(error){setCartFeedback(error instanceof Error?error.message:"Could not update your bag.");}};
  const toggleFavorite=async(name:string)=>{const next=favorites.includes(name)?favorites.filter(x=>x!==name):[...favorites,name];setFavorites(next);try{await AsyncStorage.setItem("lumina_favorites",JSON.stringify(next));}catch{Alert.alert("Could not save favourite","Please try again.");}};
  const categories=["All",...Array.from(new Set(services.map(item=>item.category).filter((value):value is string=>Boolean(value))))];
  const visibleServices = services.filter((item) => (category === "All" || item.category === category) && `${item.name} ${item.description ?? ""}`.toLowerCase().includes(debouncedSearch.toLowerCase()));
  return <SafeAreaView style={styles.safeArea} edges={["top"]}><PremiumBackdrop>
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.header}><LuminaLogo height={32} /><Pressable onPress={() => router.push("/cart")} style={styles.cartButton}><Text style={styles.cartText}>Cart  →</Text></Pressable></View>
      <Text style={styles.eyebrow}>PREMIUM GARMENT CARE</Text>
      <Text style={styles.title}>Choose a service</Text>
      <Text style={styles.subtitle}>Professional care, transparent pricing and doorstep convenience.</Text>
      <TextInput value={search} onChangeText={setSearch} placeholder="Search laundry services" placeholderTextColor="#4B5B50" style={styles.search} accessibilityLabel="Search services"/>
      <View style={styles.filters}>{categories.map(item=><Pressable key={item} onPress={()=>setCategory(item)} style={[styles.filter,category===item&&styles.filterActive]}><Text style={[styles.filterText,category===item&&styles.filterTextActive]}>{item}</Text></Pressable>)}</View>
      {!!cartFeedback&&<View style={styles.cartFeedback}><Text style={styles.cartFeedbackText}>{cartFeedback}</Text><Pressable accessibilityRole="button" onPress={()=>router.push("/cart")}><Text style={styles.cartFeedbackLink}>Open bag  →</Text></Pressable></View>}
      <View style={styles.banner}><Text style={styles.bannerTitle}>Laundry, made simple.</Text><Text style={styles.bannerText}>Doorstep pickup and delivery, with care for every item.</Text></View>
      {loading && <Text style={styles.description}>Loading services from Lumina…</Text>}{!loading && !!apiError && <View style={styles.noResults}><Text style={styles.cardTitle}>Could not load live services</Text><Text style={styles.description}>{apiError}</Text><Pressable onPress={() => void loadCatalogue()}><Text style={styles.cartFeedbackLink}>Retry</Text></Pressable></View>}
 {!loading&&!apiError&&visibleServices.length===0&&<View style={styles.noResults}><Text style={styles.cardTitle}>No matching services</Text><Text style={styles.description}>Try another search or category.</Text></View>}
      {visibleServices.map((service,index) => <View key={service.id} style={styles.card}>
        <View style={styles.iconBox}><Text style={styles.icon}>{icons[index%icons.length]}</Text></View>
        <View style={styles.cardBody}><Pressable accessibilityRole="button" onPress={() => router.push({ pathname: "/service-details" as RelativePathString, params: { id: String(service.id) } })}><Text style={styles.cardTitle}>{service.name}  →</Text></Pressable><Text style={styles.description}>{service.description||"Laundry care from a trusted local shop."}</Text><Text style={styles.price}>From ₹{service.price.toLocaleString("en-IN")}</Text><Pressable style={styles.addButton} onPress={() => void handleAddToCart(service)}><Text style={styles.addButtonText}>{service.variants.length ? "Choose options  +" : "Add to cart  +"}</Text></Pressable></View>
        <Pressable onPress={()=>void toggleFavorite(service.name)} accessibilityLabel={favorites.includes(service.name)?`Remove ${service.name} from favourites`:`Save ${service.name} to favourites`}><Text style={[styles.heart,favorites.includes(service.name)&&styles.heartActive]}>{favorites.includes(service.name)?"♥":"♡"}</Text></Pressable>
      </View>)}
      <View style={styles.info}><Text style={styles.infoTitle}>Lumina services</Text><Text style={styles.infoText}>Services and prices are loaded from the configured Laravel API. Adding an item to your bag does not place an order or collect payment.</Text></View>
  </ScrollView>
  </PremiumBackdrop></SafeAreaView>;
}

const baseStyles = StyleSheet.create({
  safeArea:{flex:1,backgroundColor:"#F7F5F0"},content:{padding:22,paddingBottom:34},header:{flexDirection:"row",alignItems:"center",justifyContent:"space-between"},brand:{color:AQUA,fontSize:23,letterSpacing:3,fontFamily:"serif"},caption:{color:"#4B5B50",fontSize:9,letterSpacing:2,marginTop:3},cartButton:{backgroundColor:"#E3EEE6",paddingHorizontal:14,paddingVertical:11,borderRadius:12},cartText:{color:AQUA,fontSize:12,fontWeight:"800"},eyebrow:{color:AQUA,fontSize:10,fontWeight:"900",letterSpacing:1.5,marginTop:25},title:{color:NAVY,fontSize:32,fontWeight:"700",fontFamily:"serif",marginTop:7},subtitle:{color:"#4B5B50",fontSize:13,lineHeight:20,marginTop:8},search:{backgroundColor:"#FFFDFA",borderWidth:1,borderColor:"#CDD8CE",borderRadius:12,padding:13,color:NAVY,fontSize:13,marginTop:17},filters:{flexDirection:"row",flexWrap:"wrap",gap:8,marginTop:12},filter:{borderWidth:1,borderColor:"#CDD8CE",borderRadius:20,paddingHorizontal:13,paddingVertical:9},filterActive:{backgroundColor:NAVY,borderColor:NAVY},filterText:{color:NAVY,fontSize:11,fontWeight:"700"},filterTextActive:{color:"#FFFDFA"},cartFeedback:{backgroundColor:"#E3EEE6",borderRadius:12,padding:13,marginTop:13,flexDirection:"row",alignItems:"center",justifyContent:"space-between",gap:12},cartFeedbackText:{flex:1,color:NAVY,fontSize:12,fontWeight:"700"},cartFeedbackLink:{color:AQUA,fontSize:11,fontWeight:"800"},banner:{backgroundColor:"#E3EEE6",borderRadius:18,padding:20,marginTop:20,marginBottom:20},bannerTitle:{color:NAVY,fontSize:21,fontWeight:"700",fontFamily:"serif"},bannerText:{color:"#4B5B50",fontSize:13,lineHeight:19,marginTop:6},card:{backgroundColor:"#FFFDFA",borderRadius:16,borderWidth:1,borderColor:"#CDD8CE",padding:15,marginBottom:12,flexDirection:"row",alignItems:"flex-start"},iconBox:{width:48,height:48,borderRadius:14,backgroundColor:"#E3EEE6",alignItems:"center",justifyContent:"center"},icon:{fontSize:25,color:AQUA},cardBody:{flex:1,marginLeft:13,marginRight:8},cardTitle:{color:NAVY,fontSize:15,fontWeight:"700"},description:{color:"#4B5B50",fontSize:11,lineHeight:16,marginTop:5},price:{color:AQUA,fontSize:11,fontWeight:"700",marginTop:8},addButton:{alignSelf:"flex-start",backgroundColor:AQUA,borderRadius:9,paddingHorizontal:12,paddingVertical:9,marginTop:10},addButtonText:{color:"#FFFDFA",fontSize:11,fontWeight:"800"},heart:{color:"#4B5B50",fontSize:22,padding:3},heartActive:{color:"#A93226"},noResults:{backgroundColor:"#FFFDFA",borderRadius:14,padding:18,marginTop:8},info:{backgroundColor:NAVY,borderRadius:16,padding:17,marginTop:8},infoTitle:{color:"#FFFDFA",fontSize:14,fontWeight:"800"},infoText:{color:"#E3EEE6",fontSize:12,lineHeight:18,marginTop:7}
});
