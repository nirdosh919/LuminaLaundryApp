import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BrandColors } from "@/constants/theme";
import { useThemedStyles } from "@/hooks/use-themed-styles";

type CartItem = { id: string; service_item_id?: number; name: string; price: number; quantity: number; unit: string };
const AQUA = BrandColors.forest, NAVY = BrandColors.ink, CREAM = BrandColors.cream;
const money = (value: number) => `₹${value.toLocaleString("en-IN")}`;

export default function CartScreen() {
  const s = useThemedStyles(baseStyles);
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);
  const [removeId, setRemoveId] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [storageError, setStorageError] = useState("");
  const refresh = useCallback(() => {
    let active = true;
    AsyncStorage.getItem("lumina_cart").then(raw => {
      if (!active) return;
      try { setItems(raw ? JSON.parse(raw) as CartItem[] : []); }
      catch { setItems([]); }
      setReady(true);
    }).catch(() => { if (active) { setItems([]); setReady(true); } });
    return () => { active = false; };
  }, []);
  useFocusEffect(refresh);
  const update = async (next: CartItem[]) => {
    try {
      await AsyncStorage.setItem("lumina_cart", JSON.stringify(next));
      setItems(next);
      setStorageError("");
    } catch (error) {
      setStorageError(error instanceof Error ? error.message : "Could not update cart. Please try again.");
    }
  };
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  return <SafeAreaView style={s.safe} edges={["top"]}>
    <ScrollView contentContainerStyle={s.content}>
      <Pressable onPress={() => router.back()}><Text style={s.back}>←  Services</Text></Pressable>
      <Text style={s.eyebrow}>YOUR BAG</Text><Text style={s.title}>Review services</Text>
      <Text style={s.sub}>{items.length} {items.length === 1 ? "service" : "services"} in your bag</Text>
      {!!storageError && <Text style={s.error}>{storageError}</Text>}
      {!ready ? <Text style={s.note}>Loading your cart…</Text> : items.length === 0 ? <View style={s.empty}>
        <Text style={s.emptyIcon}>▱</Text><Text style={s.emptyTitle}>Your cart is empty</Text>
        <Text style={s.note}>Choose a service and we’ll take care of the rest.</Text>
        <Pressable style={s.primary} onPress={() => router.push("/services")}><Text style={s.primaryText}>Browse services</Text></Pressable>
      </View> : <>
        {items.map(item => <View key={item.id} style={s.row}>
          <View style={s.icon}><Text style={s.iconText}>✧</Text></View>
          <View style={s.itemBody}><Text style={s.itemName}>{item.name}</Text><Text style={s.itemMeta}>{money(item.price)} / {item.unit}</Text>
            <View style={s.controls}>
              <Pressable accessibilityLabel={`Decrease ${item.name}`} style={s.qtyButton} onPress={() => void update(items.map(x => x.id === item.id ? { ...x, quantity: Math.max(1, x.quantity - 1) } : x))}><Text style={s.qtyText}>−</Text></Pressable>
              <Text style={s.qty}>{item.quantity}</Text>
              <Pressable accessibilityLabel={`Increase ${item.name}`} style={s.qtyButton} onPress={() => void update(items.map(x => x.id === item.id ? { ...x, quantity: Math.min(50, x.quantity + 1) } : x))}><Text style={s.qtyText}>+</Text></Pressable>
              <Pressable accessibilityRole="button" style={s.remove} onPress={() => setRemoveId(removeId === item.id ? null : item.id)}><Text style={s.removeText}>Remove</Text></Pressable>
            </View>
            {removeId === item.id && <View style={s.confirmRow}><Text style={s.note}>Remove this service from your bag?</Text><Pressable accessibilityRole="button" onPress={() => {setRemoveId(null);void update(items.filter(x=>x.id!==item.id));}}><Text style={s.removeText}>Remove</Text></Pressable><Pressable accessibilityRole="button" onPress={() => setRemoveId(null)}><Text style={s.keepText}>Keep</Text></Pressable></View>}
          </View><Text style={s.lineTotal}>{money(item.price * item.quantity)}</Text>
        </View>)}
        <View style={s.summary}><Text style={s.summaryTitle}>Order summary</Text>
          <View style={s.summaryRow}><Text style={s.note}>Subtotal</Text><Text style={s.summaryValue}>{money(subtotal)}</Text></View>
          <View style={[s.summaryRow, s.totalRow]}><Text style={s.totalLabel}>Demo estimate</Text><Text style={s.totalLabel}>{money(subtotal)}</Text></View>
          <Text style={s.note}>Sample prices only; these are not official Lumina rates.</Text>
          <Pressable style={s.primary} onPress={() => router.push("/checkout")}><Text style={s.primaryText}>Choose pickup time  →</Text></Pressable>
        </View>
        <Pressable accessibilityRole="button" style={s.clear} onPress={() => setConfirmClear(value => !value)}><Text style={s.removeText}>Clear cart</Text></Pressable>
        {confirmClear && <View style={s.confirmClear}><Text style={s.note}>Remove every service from your bag?</Text><View style={s.clearActions}><Pressable accessibilityRole="button" onPress={() => {setConfirmClear(false);void update([]);}}><Text style={s.removeText}>Clear all</Text></Pressable><Pressable accessibilityRole="button" onPress={() => setConfirmClear(false)}><Text style={s.keepText}>Keep cart</Text></Pressable></View></View>}
      </>}
    </ScrollView>
  </SafeAreaView>;
}

const baseStyles = StyleSheet.create({ safe:{flex:1,backgroundColor:CREAM},content:{padding:20,paddingBottom:40,alignSelf:"stretch"},back:{color:AQUA,fontSize:14,fontWeight:"700",paddingVertical:12},eyebrow:{color:AQUA,fontSize:10,fontWeight:"800",letterSpacing:1.8,marginTop:16},title:{color:NAVY,fontSize:32,fontFamily:"serif",fontWeight:"700",marginTop:5},sub:{color:"#4B5B50",fontSize:13,marginTop:7,marginBottom:22},error:{color:"#A93226",fontSize:12,lineHeight:18,marginBottom:10},empty:{backgroundColor:"#FFFDFA",borderRadius:20,padding:24,alignItems:"center",borderWidth:1,borderColor:"#CDD8CE",marginTop:15},emptyIcon:{fontSize:40,color:AQUA},emptyTitle:{fontSize:20,color:NAVY,fontWeight:"700",marginTop:8},note:{color:"#4B5B50",fontSize:12,lineHeight:18,marginTop:5},primary:{backgroundColor:AQUA,borderRadius:13,alignItems:"center",padding:15,marginTop:17},primaryText:{color:"#FFFDFA",fontSize:13,fontWeight:"800"},row:{backgroundColor:"#FFFDFA",borderWidth:1,borderColor:"#CDD8CE",borderRadius:16,padding:13,marginBottom:11,flexDirection:"row",alignItems:"flex-start",gap:10},icon:{width:42,height:42,borderRadius:13,backgroundColor:"#E3EEE6",alignItems:"center",justifyContent:"center"},iconText:{color:AQUA,fontSize:23},itemBody:{flex:1,minWidth:0},itemName:{fontWeight:"800",fontSize:14,color:NAVY},itemMeta:{fontSize:11,color:"#4B5B50",marginTop:4},controls:{flexDirection:"row",alignItems:"center",gap:10,marginTop:12},qtyButton:{width:32,height:32,borderRadius:9,backgroundColor:"#E3EEE6",alignItems:"center",justifyContent:"center"},qtyText:{color:AQUA,fontSize:17,fontWeight:"700"},qty:{color:NAVY,fontWeight:"700",minWidth:14,textAlign:"center"},remove:{padding:5,marginLeft:2},removeText:{color:"#A93226",fontSize:11,fontWeight:"700"},keepText:{color:AQUA,fontSize:11,fontWeight:"800"},confirmRow:{flexDirection:"row",alignItems:"center",gap:12,marginTop:9},confirmClear:{backgroundColor:"#E3EEE6",borderRadius:12,padding:13,marginTop:8},clearActions:{flexDirection:"row",justifyContent:"flex-end",gap:16,marginTop:10},lineTotal:{fontWeight:"800",fontSize:12,color:NAVY,marginTop:3,flexShrink:0},summary:{backgroundColor:"#E3EEE6",borderRadius:17,padding:17,marginTop:13,alignSelf:"stretch"},summaryTitle:{fontSize:16,color:NAVY,fontWeight:"800",marginBottom:9},summaryRow:{flexDirection:"row",justifyContent:"space-between",alignItems:"center",paddingVertical:7,alignSelf:"stretch"},summaryValue:{fontSize:13,color:NAVY,fontWeight:"600",flexShrink:0,marginLeft:12},totalRow:{borderTopWidth:1,borderTopColor:"#CDD8CE",marginTop:6,paddingTop:13},totalLabel:{fontSize:16,color:NAVY,fontWeight:"900"},disabled:{opacity:.45},clear:{alignItems:"center",padding:15,marginTop:4}});

