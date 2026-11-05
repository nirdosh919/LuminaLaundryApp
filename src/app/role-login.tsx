import React,{useState} from "react";
import {Alert,Pressable,ScrollView,StyleSheet,Text,TextInput,View} from "react-native";
import {useLocalSearchParams,useRouter} from "expo-router";
import {SafeAreaView} from "react-native-safe-area-context";
import {dashboardForRole,signIn,type AccountRole} from "@/lib/auth";
import {LuminaLogo} from "@/components/brand-ui";
import {useAppTheme} from "@/providers/app-theme-provider";
import {useRoleAccess} from "@/providers/role-access-provider";

const roles:AccountRole[]=["customer","admin","vendor","driver"];
const labels:Record<AccountRole,string>={customer:"Customer",admin:"Admin",vendor:"Vendor",driver:"Driver"};

export default function RoleLoginScreen(){
 const router=useRouter(),params=useLocalSearchParams<{role?:string}>(),{colors}=useAppTheme(),{activateRole}=useRoleAccess();
 const initial=roles.includes(params.role as AccountRole)?params.role as AccountRole:"customer";
 const [role,setRole]=useState<AccountRole>(initial),[identity,setIdentity]=useState(""),[password,setPassword]=useState(""),[busy,setBusy]=useState(false);
 const select=(next:AccountRole)=>{setRole(next);setIdentity("");setPassword("");router.setParams({role:next});};
 const login=async()=>{if(!identity.trim()||!password){Alert.alert("Missing details",role==="driver"?"Enter your registered phone number and password.":"Enter your registered email and password.");return;}setBusy(true);try{const account=await signIn(role,identity.trim(),password);activateRole(account.role);router.replace(dashboardForRole(account.role) as never);}catch(e){Alert.alert("Sign in failed",e instanceof Error?e.message:"Please try again.");}finally{setBusy(false);}};
 const showRegister=role==="customer"||role==="vendor";
 return <SafeAreaView style={[s.safe,{backgroundColor:colors.background}]} edges={["top","bottom"]}><ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
  <View style={s.brand}><LuminaLogo height={48}/><Text style={{color:colors.textSecondary,fontSize:9,fontWeight:"700",letterSpacing:1.5}}>LAUNDRY, MADE SIMPLE</Text></View>
  <Text style={[s.title,{color:colors.text}]}>Sign in</Text><Text style={[s.subtitle,{color:colors.textSecondary}]}>Choose your account and continue.</Text>
  <View style={s.grid}>{roles.map(item=><Pressable key={item} onPress={()=>select(item)} style={[s.role,{backgroundColor:role===item?colors.accentSoft:colors.surface,borderColor:role===item?colors.primary:colors.border}]}><Text style={{color:role===item?colors.primaryStrong:colors.text,fontSize:13,fontWeight:"700"}}>{labels[item]}</Text></Pressable>)}</View>
  <View style={[s.form,{backgroundColor:colors.surface,borderColor:colors.border}]}>
   <Text style={[s.formTitle,{color:colors.text}]}>{labels[role]} login</Text>
   <Text style={[s.label,{color:colors.text}]}>{role==="driver"?"PHONE NUMBER":"EMAIL ADDRESS"}</Text>
   <TextInput value={identity} onChangeText={setIdentity} placeholder={role==="driver"?"Registered phone number":"name@example.com"} placeholderTextColor={colors.textSecondary} keyboardType={role==="driver"?"phone-pad":"email-address"} autoCapitalize="none" autoCorrect={false} style={[s.input,{backgroundColor:colors.input,borderColor:colors.border,color:colors.text}]}/>
   <Text style={[s.label,{color:colors.text}]}>PASSWORD</Text>
   <TextInput value={password} onChangeText={setPassword} placeholder="Enter password" placeholderTextColor={colors.textSecondary} secureTextEntry autoCapitalize="none" onSubmitEditing={()=>void login()} style={[s.input,{backgroundColor:colors.input,borderColor:colors.border,color:colors.text}]}/>
   <Pressable onPress={()=>router.push((role==="vendor"?"/vendor-forgot-password":"/forgot-password") as never)} style={s.forgot}><Text style={[s.link,{color:colors.primary}]}>Forgot password?</Text></Pressable>
   <Pressable disabled={busy} onPress={()=>void login()} style={[s.submit,{backgroundColor:colors.primary},busy&&{opacity:.65}]}><Text style={{color:colors.onPrimary,fontSize:13,fontWeight:"800"}}>{busy?"Signing in…":"Sign in"}</Text></Pressable>
  </View>
  {showRegister?<View style={s.register}><Text style={{color:colors.textSecondary}}>New to Lumina? </Text><Pressable onPress={()=>router.push((role==="vendor"?"/vendor-register":"/register") as never)}><Text style={[s.link,{color:colors.primary}]}>{role==="vendor"?"Register your shop":"Create account"}</Text></Pressable></View>:<Text style={[s.note,{color:colors.textSecondary}]}>Admin and driver access is provided by Lumina.</Text>}
 </ScrollView></SafeAreaView>;
}
const s=StyleSheet.create({safe:{flex:1},content:{flexGrow:1,justifyContent:"center",paddingHorizontal:22,paddingVertical:28},brand:{alignItems:"center",marginBottom:28,gap:5},title:{fontSize:29,fontWeight:"800",textAlign:"center"},subtitle:{fontSize:13,textAlign:"center",marginTop:5,marginBottom:22},grid:{flexDirection:"row",flexWrap:"wrap",gap:9,marginBottom:16},role:{width:"48%",minHeight:46,borderRadius:11,borderWidth:1,alignItems:"center",justifyContent:"center"},form:{borderWidth:1,borderRadius:16,padding:18},formTitle:{fontSize:17,fontWeight:"800",marginBottom:17},label:{fontSize:10,fontWeight:"800",letterSpacing:.8,marginBottom:7},input:{minHeight:48,borderWidth:1,borderRadius:10,paddingHorizontal:12,fontSize:13,marginBottom:15},forgot:{alignSelf:"flex-end",marginTop:-5,marginBottom:15},link:{fontSize:12,fontWeight:"700"},submit:{minHeight:49,borderRadius:11,alignItems:"center",justifyContent:"center"},register:{flexDirection:"row",justifyContent:"center",alignItems:"center",marginTop:20},note:{textAlign:"center",fontSize:11,marginTop:20}});
