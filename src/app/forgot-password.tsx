import React, { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useThemedStyles } from "@/hooks/use-themed-styles";
import { requestPasswordReset } from "@/lib/laundry-api";

export default function ForgotPasswordScreen(){
  const s=useThemedStyles(baseStyles);
  const [email,setEmail]=useState("");
  const submit=async()=>{
    if(!/^\S+@\S+\.\S+$/.test(email.trim())) return Alert.alert("Enter a valid email", "We need the email address linked to your account.");
    try { Alert.alert("Check your email", await requestPasswordReset(email.trim())); }
    catch (error) { Alert.alert("Could not request reset", error instanceof Error ? error.message : "Please try again."); }
  };
  return <SafeAreaView style={s.safe} edges={["top"]}><ScrollView contentContainerStyle={s.content}>
    <Pressable onPress={()=>router.back()}><Text style={s.back}>←  Back to sign in</Text></Pressable>
    <View style={s.card}><Text style={s.icon}>✉</Text><Text style={s.title}>Reset password</Text><Text style={s.body}>Enter the email address on your Lumina account. If an account exists for that email, a reset link will be sent.</Text><Text style={s.label}>Email address</Text><TextInput value={email} onChangeText={setEmail} placeholder="you@example.com" placeholderTextColor="#4B5B50" keyboardType="email-address" autoCapitalize="none" style={s.input}/><Pressable style={s.button} onPress={submit}><Text style={s.buttonText}>Request reset link</Text></Pressable></View>
  </ScrollView></SafeAreaView>;
}
const baseStyles=StyleSheet.create({safe:{flex:1,backgroundColor:"#F7F5F0"},content:{padding:20,flexGrow:1,justifyContent:"center"},back:{color:"#214738",fontSize:13,fontWeight:"700",paddingVertical:15},card:{backgroundColor:"#FFFDFA",borderRadius:20,padding:22,borderWidth:1,borderColor:"#CDD8CE"},icon:{fontSize:30,color:"#214738"},title:{fontSize:27,color:"#214738",fontWeight:"900",marginTop:13},body:{color:"#4B5B50",fontSize:13,lineHeight:20,marginTop:8},label:{fontSize:12,color:"#214738",fontWeight:"800",marginTop:24,marginBottom:7},input:{backgroundColor:"#FFFDFA",borderWidth:1,borderColor:"#CDD8CE",borderRadius:11,padding:13,color:"#214738"},button:{backgroundColor:"#214738",borderRadius:12,padding:15,alignItems:"center",marginTop:15},buttonText:{color:"#FFFDFA",fontWeight:"900"}});
