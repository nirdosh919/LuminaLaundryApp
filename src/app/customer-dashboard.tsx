import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { fetchOrders } from "@/lib/laundry-api";
import { loadAddresses } from "@/lib/address-book";
import { useThemedStyles } from "@/hooks/use-themed-styles";
import { LuminaLogo } from "@/components/brand-ui";

type Order={id:string;service:string;status:string;date?:string;amount?:string;pickup?:string};
type Profile={name?:string;phone?:string;email?:string;address?:string};
export default function CustomerDashboard(){
  const s=useThemedStyles(baseStyles);
  const router=useRouter();const [profile,setProfile]=useState<Profile>({});const [orders,setOrders]=useState<Order[]>([]);const [addressCount,setAddressCount]=useState(0);const [loading,setLoading]=useState(true);const [loadError,setLoadError]=useState("");
  const reload = useCallback(async (isActive: () => boolean = () => true) => {
    setLoading(true);
    setLoadError("");
    try {
      const [rawProfile, serverOrders, addresses] = await Promise.all([
        AsyncStorage.getItem("lumina_profile"),
        fetchOrders(),
        loadAddresses(),
      ]);
      if (!isActive()) return;
      const parsed: unknown = rawProfile ? JSON.parse(rawProfile) : {};
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        throw new Error("Saved profile has an unsupported format.");
      }
      setProfile(parsed as Profile);
      setOrders(serverOrders.map(order=>({id:order.order_number,service:order.service,status:order.status_label,date:order.created_at?new Date(order.created_at).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"}):"",amount:`₹${order.total_amount.toLocaleString("en-IN")}`,pickup:[order.pickup_date,order.pickup_time_slot].filter(Boolean).join(" · ")})));
      setAddressCount(addresses.length);
    } catch (error) {
      if (isActive()) setLoadError(error instanceof Error ? error.message : "Could not load account details.");
    } finally {
      if (isActive()) setLoading(false);
    }
  }, []);
  useFocusEffect(useCallback(()=>{let active=true;void reload(()=>active);return()=>{active=false;};},[reload]));
  const recent=orders[0];const activeOrders=orders.filter(x=>!/[Dd]elivered|[Cc]ompleted|[Cc]ancelled/.test(x.status)).length;
  const quick=[{icon:"▤",title:"My orders",detail:`${orders.length} total · ${activeOrders} active`,route:"/orders"},{icon:"⌖",title:"Saved addresses",detail:`${addressCount} pickup ${addressCount===1?"location":"locations"}`,route:"/addresses"},{icon:"♡",title:"Favourites",detail:"Your saved services",route:"/favorites"},{icon:"✧",title:"Help & support",detail:"Get help with your laundry",route:"/support"}];
  return <SafeAreaView style={s.safe} edges={["top"]}><ScrollView contentContainerStyle={s.content}>
    <View style={s.header}><LuminaLogo height={32} /><Pressable onPress={()=>router.push("/profile")} style={s.avatar}><Text style={s.avatarText}>{profile.name?.trim().charAt(0).toUpperCase()||"L"}</Text></Pressable></View>
    <View style={s.welcome}><Text style={s.eyebrow}>YOUR LAUNDRY, ORGANIZED</Text><Text style={s.title}>Hello{profile.name?`, ${profile.name.split(" ")[0]}`:" there"}.</Text><Text style={s.welcomeText}>Your pickup details and recent laundry orders, all in one place.</Text><Pressable style={s.primary} onPress={()=>router.push("/services")}><Text style={s.primaryText}>Book a pickup  →</Text></Pressable></View>
    {loading && <ActivityIndicator color="#214738" style={{ marginTop: 16 }} />}
    {!!loadError && <View style={s.empty}><Text style={s.emptyTitle}>Could not load account</Text><Text style={s.orderMeta}>{loadError}</Text><Pressable onPress={() => void reload()} style={s.emptyLink}><Text style={s.link}>Try again</Text></Pressable></View>}
    <View style={s.stats}><View style={s.stat}><Text style={s.statValue}>{loading||loadError?"—":orders.length}</Text><Text style={s.statLabel}>Total orders</Text></View><View style={s.divider}/><View style={s.stat}><Text style={s.statValue}>{loading||loadError?"—":activeOrders}</Text><Text style={s.statLabel}>In progress</Text></View><View style={s.divider}/><View style={s.stat}><Text style={s.statValue}>{loading||loadError?"—":addressCount}</Text><Text style={s.statLabel}>Addresses</Text></View></View>
    <View style={s.sectionHeader}><Text style={s.sectionTitle}>Recent order</Text><Pressable onPress={()=>router.push("/orders")}><Text style={s.link}>View all</Text></Pressable></View>
    {recent&&!loading&&!loadError?<Pressable style={s.orderCard} onPress={()=>router.push("/orders")}><View style={s.orderTop}><Text style={s.orderIcon}>◉</Text><View style={s.orderBody}><Text style={s.orderService}>{recent.service}</Text><Text style={s.orderMeta}>#{recent.id}{recent.date?` · ${recent.date}`:""}</Text></View><Text style={s.status}>{recent.status}</Text></View><View style={s.orderBottom}><Text style={s.orderMeta}>{recent.pickup||"Pickup schedule pending"}</Text><Text style={s.amount}>{recent.amount||"Amount pending"}</Text></View></Pressable>:!loading&&!loadError?<View style={s.empty}><Text style={s.emptyTitle}>No orders yet</Text><Text style={s.orderMeta}>Your first laundry pickup is just a few taps away.</Text><Pressable onPress={()=>router.push("/services")} style={s.emptyLink}><Text style={s.link}>Explore services  →</Text></Pressable></View>:null}
    <Text style={s.sectionTitle}>Manage your account</Text>
    {quick.map(item=><Pressable key={item.route} style={s.menu} onPress={()=>router.push(item.route as never)}><View style={s.menuIcon}><Text style={s.menuIconText}>{item.icon}</Text></View><View style={s.menuBody}><Text style={s.menuTitle}>{item.title}</Text><Text style={s.menuDetail}>{item.detail}</Text></View><Text style={s.arrow}>›</Text></Pressable>)}
    <Pressable style={s.profileLink} onPress={()=>router.push("/profile")}><Text style={s.link}>View or edit profile details  →</Text></Pressable>
  </ScrollView></SafeAreaView>;
}
const baseStyles=StyleSheet.create({safe:{flex:1,backgroundColor:"#F7F5F0"},content:{padding:20,paddingBottom:40},header:{flexDirection:"row",alignItems:"center",justifyContent:"space-between",paddingVertical:9},brand:{color:"#214738",fontSize:23,letterSpacing:3,fontFamily:"serif"},brandSub:{color:"#4B5B50",fontSize:8,letterSpacing:1.7,marginTop:3},avatar:{width:42,height:42,borderRadius:21,backgroundColor:"#E3EEE6",alignItems:"center",justifyContent:"center"},avatarText:{color:"#214738",fontSize:17,fontWeight:"800"},welcome:{backgroundColor:"#214738",borderRadius:21,padding:20,marginTop:18},eyebrow:{color:"#2F674A",fontSize:9,fontWeight:"800",letterSpacing:1.7},title:{color:"#FFFDFA",fontSize:29,fontFamily:"serif",fontWeight:"700",marginTop:8},welcomeText:{color:"#E0E8E1",fontSize:12,lineHeight:18,marginTop:6},primary:{backgroundColor:"#F7F5F0",borderRadius:11,paddingHorizontal:15,paddingVertical:12,alignSelf:"flex-start",marginTop:15},primaryText:{color:"#214738",fontSize:12,fontWeight:"800"},stats:{flexDirection:"row",alignItems:"center",backgroundColor:"#E3EEE6",borderRadius:15,paddingVertical:15,marginTop:14},stat:{flex:1,alignItems:"center"},statValue:{color:"#214738",fontSize:20,fontWeight:"900"},statLabel:{color:"#4B5B50",fontSize:9,marginTop:4},divider:{width:1,height:32,backgroundColor:"#CDD8CE"},sectionHeader:{flexDirection:"row",justifyContent:"space-between",alignItems:"center",marginTop:25,marginBottom:11},sectionTitle:{color:"#214738",fontSize:18,fontWeight:"800",marginTop:20,marginBottom:10},link:{color:"#214738",fontSize:11,fontWeight:"800"},orderCard:{backgroundColor:"#FFFDFA",borderWidth:1,borderColor:"#CDD8CE",borderRadius:15,padding:14},orderTop:{flexDirection:"row",alignItems:"center",gap:10},orderIcon:{color:"#214738",fontSize:22},orderBody:{flex:1},orderService:{color:"#214738",fontSize:13,fontWeight:"800"},orderMeta:{color:"#4B5B50",fontSize:10,marginTop:4},status:{color:"#214738",fontSize:10,fontWeight:"800",backgroundColor:"#E3EEE6",borderRadius:9,paddingHorizontal:9,paddingVertical:6},orderBottom:{flexDirection:"row",justifyContent:"space-between",alignItems:"center",marginTop:14,paddingTop:11,borderTopWidth:1,borderTopColor:"#F7F5F0"},amount:{color:"#214738",fontSize:11,fontWeight:"800"},empty:{backgroundColor:"#FFFDFA",borderRadius:15,padding:16,borderWidth:1,borderColor:"#CDD8CE"},emptyTitle:{color:"#214738",fontSize:14,fontWeight:"800"},emptyLink:{marginTop:9},menu:{backgroundColor:"#FFFDFA",borderWidth:1,borderColor:"#CDD8CE",borderRadius:14,padding:12,marginBottom:9,flexDirection:"row",alignItems:"center",gap:11},menuIcon:{width:39,height:39,borderRadius:12,backgroundColor:"#E3EEE6",alignItems:"center",justifyContent:"center"},menuIconText:{color:"#214738",fontSize:20},menuBody:{flex:1},menuTitle:{color:"#214738",fontSize:12,fontWeight:"800"},menuDetail:{color:"#4B5B50",fontSize:10,marginTop:4},arrow:{color:"#214738",fontSize:23},profileLink:{alignItems:"center",padding:14}});
