
import React, { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useThemedStyles } from "@/hooks/use-themed-styles";
import { registerCustomer } from "@/lib/auth";
import { BrandColors } from "@/constants/theme";
import { PremiumBackdrop } from "@/components/premium-ui";
import { useRoleAccess } from "@/providers/role-access-provider";

export default function RegisterScreen() {
  const { activateRole } = useRoleAccess();
  const s = useThemedStyles(baseStyles);
  const [accountType, setAccountType] = useState<"customer" | "vendor">("customer");
  const [name,setName]=useState(""); const [email,setEmail]=useState(""); const [phone,setPhone]=useState(""); const [address,setAddress]=useState(""); const [password,setPassword]=useState(""); const [busy,setBusy]=useState(false);
  const create = async () => {
    if (accountType !== "customer") return;
    if (!name.trim() || !/^\S+@\S+\.\S+$/.test(email.trim()) || !/^[6-9]\d{9}$/.test(phone) || !address.trim() || password.length < 8) return Alert.alert("Check your details", "Add your name, valid email, 10-digit Indian mobile, address and a password with at least 8 characters.");
    setBusy(true);
    try {
      const account = await registerCustomer({ name, email, phone, password, address });
      activateRole(account.role);
      router.replace("/customer-dashboard" as never);
    } catch (error) { Alert.alert("Could not create account", error instanceof Error ? error.message : "Please try again."); }
    finally { setBusy(false); }
  };
  const field=(label:string,value:string,set:(v:string)=>void,placeholder:string,options:{phone?:boolean;secure?:boolean;email?:boolean;multiline?:boolean}={})=><View style={s.field}><Text style={s.label}>{label}</Text><TextInput value={value} onChangeText={set} placeholder={placeholder} placeholderTextColor="#899187" style={[s.input,options.multiline&&s.multiline]} keyboardType={options.phone?"phone-pad":options.email?"email-address":"default"} autoCapitalize={options.email?"none":"words"} secureTextEntry={options.secure} maxLength={options.phone?10:undefined} multiline={options.multiline} textAlignVertical={options.multiline?"top":"center"}/></View>;
  return <SafeAreaView style={s.safe} edges={["top"]}><PremiumBackdrop><ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
    <Pressable onPress={()=>router.back()}><Text style={s.back}>←  Back</Text></Pressable><Text style={s.eyebrow}>JOIN LUMINA</Text><Text style={s.title}>Create an account</Text><Text style={s.subtitle}>Choose how you want to use Lumina.</Text>
    <View style={s.typeChoices}>
      <Pressable accessibilityRole="radio" accessibilityState={{checked:accountType==="customer"}} onPress={()=>setAccountType("customer")} style={[s.typeChoice,accountType==="customer"&&s.typeChoiceSelected]}><Text style={[s.typeTitle,accountType==="customer"&&s.typeTitleSelected]}>Customer</Text><Text style={s.typeDescription}>Book laundry pickups and manage orders.</Text></Pressable>
      <Pressable accessibilityRole="radio" accessibilityState={{checked:accountType==="vendor"}} onPress={()=>setAccountType("vendor")} style={[s.typeChoice,accountType==="vendor"&&s.typeChoiceSelected]}><Text style={[s.typeTitle,accountType==="vendor"&&s.typeTitleSelected]}>Laundry partner</Text><Text style={s.typeDescription}>Apply to manage your shop on Lumina.</Text></Pressable>
    </View>
    {accountType==="customer" ? <View style={s.card}>{field("Full name",name,setName,"Your name")}{field("Email address",email,setEmail,"you@example.com",{email:true})}{field("Mobile number",phone,v=>setPhone(v.replace(/\D/g,"")),"10-digit mobile number",{phone:true})}{field("Pickup address",address,setAddress,"House, street, area, city and PIN code",{multiline:true})}{field("Password",password,setPassword,"At least 8 characters",{secure:true})}
      <Pressable disabled={busy} style={s.button} onPress={()=>void create()}><Text style={s.buttonText}>{busy?"Creating…":"Create customer account"}</Text></Pressable>
      <Text style={s.note}>Your customer account is verified by Lumina. Address is kept on this device because registration does not accept an address.</Text>
    </View> : <View style={s.card}><Text style={s.partnerTitle}>Apply for a partner account</Text><Text style={s.note}>Share your shop details in the partner application. Lumina must review and approve it before a vendor account and workspace can be created.</Text><Pressable style={s.button} onPress={()=>router.push("/vendor-register")}><Text style={s.buttonText}>Continue to shop application</Text></Pressable></View>}
    <Text style={s.staffNote}>Admin and driver accounts are created by Lumina for authorized team members.</Text>
    <Pressable style={s.login} onPress={()=>router.push("/login")}><Text style={s.link}>Already have an account? Sign in</Text></Pressable>
  </ScrollView></PremiumBackdrop></SafeAreaView>;
}
const baseStyles=StyleSheet.create({safe:{flex:1,backgroundColor:BrandColors.cream},content:{padding:20,paddingBottom:40},back:{color:BrandColors.green,fontSize:13,fontWeight:"700",paddingVertical:12},eyebrow:{color:BrandColors.green,fontSize:10,fontWeight:"900",letterSpacing:2,marginTop:16},title:{color:BrandColors.text,fontSize:31,fontWeight:"900",fontFamily:"serif",marginTop:6},subtitle:{color:BrandColors.muted,fontSize:13,lineHeight:20,marginTop:6,marginBottom:15},typeChoices:{flexDirection:"row",gap:9,marginBottom:13},typeChoice:{flex:1,minHeight:96,justifyContent:"center",backgroundColor:BrandColors.surface,borderWidth:1,borderColor:BrandColors.border,borderRadius:15,padding:12},typeChoiceSelected:{borderColor:BrandColors.forest,backgroundColor:"#EAF1E9"},typeTitle:{color:BrandColors.text,fontSize:12,fontWeight:"900"},typeTitleSelected:{color:BrandColors.forest},typeDescription:{color:BrandColors.muted,fontSize:10,lineHeight:14,marginTop:6},card:{backgroundColor:BrandColors.surface,borderRadius:20,padding:18,borderWidth:1,borderColor:BrandColors.border,shadowColor:BrandColors.forest,shadowOffset:{width:0,height:6},shadowOpacity:0.06,shadowRadius:14,elevation:2},partnerTitle:{color:BrandColors.text,fontSize:16,fontWeight:"900"},field:{marginBottom:12},label:{color:BrandColors.text,fontSize:11,fontWeight:"800",letterSpacing:0.4,marginBottom:7},input:{backgroundColor:"#FAFBF7",borderWidth:1,borderColor:BrandColors.border,borderRadius:12,paddingHorizontal:13,paddingVertical:12,color:BrandColors.text,fontSize:13},multiline:{height:76},button:{backgroundColor:BrandColors.forest,borderRadius:13,padding:15,alignItems:"center",marginTop:6},buttonText:{color:BrandColors.surface,fontWeight:"900"},note:{color:BrandColors.muted,fontSize:10,lineHeight:15,marginTop:14},staffNote:{color:BrandColors.muted,fontSize:10,lineHeight:15,textAlign:"center",marginTop:14},login:{alignItems:"center",padding:17},link:{color:BrandColors.green,fontSize:12,fontWeight:"800"}});
