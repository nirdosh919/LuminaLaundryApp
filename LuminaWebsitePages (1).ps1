$ErrorActionPreference = 'Stop'
$project = Join-Path $env:USERPROFILE 'Projects\LuminaLaundryApp'
if (!(Test-Path (Join-Path $project 'src\app\_layout.tsx'))) { throw "LuminaLaundryApp not found at $project. Open the correct project folder first." }
Set-Location $project
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$backup = Join-Path $project "_website-pages-backup-$stamp"
New-Item -ItemType Directory -Force -Path $backup | Out-Null
foreach ($f in @('src\components\app-tabs.tsx','src\app\hub.tsx')) { if (Test-Path $f) { Copy-Item $f (Join-Path $backup ([IO.Path]::GetFileName($f))) } }

# Shared, mobile-native page renderer. All interactions are local demo interactions until API integration.
$component = @'
import React, { useState } from "react";
import { Alert, ScrollView, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";

type Action = { label: string; route?: string; message?: string };
type Field = { label: string; placeholder: string; secure?: boolean; multiline?: boolean };
type Props = { title: string; eyebrow?: string; description: string; sections?: string[]; actions?: Action[]; fields?: Field[]; bullets?: string[] };
export default function WebsitePage({ title, eyebrow = "LUMINA LAUNDRY", description, sections = [], actions = [], fields = [], bullets = [] }: Props) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>({});
  return <ScrollView style={s.page} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
    <View style={s.brandRow}><View><Text style={s.eyebrow}>{eyebrow}</Text><Text style={s.brand}>LUMINA</Text><Text style={s.tagline}>LAUNDRY & CARE</Text></View><View style={s.dot}><Text style={s.dotText}>L</Text></View></View>
    <View style={s.hero}><Text style={s.kicker}>YOUR LAUNDRY, SIMPLIFIED</Text><Text style={s.title}>{title}</Text><Text style={s.description}>{description}</Text></View>
    {fields.length > 0 && <View style={s.card}><Text style={s.cardTitle}>Enter details</Text>{fields.map(f => <View key={f.label} style={s.fieldWrap}><Text style={s.label}>{f.label}</Text><TextInput value={values[f.label] || ""} onChangeText={v => setValues(old => ({...old, [f.label]: v}))} placeholder={f.placeholder} placeholderTextColor="#8B958C" secureTextEntry={f.secure} multiline={f.multiline} style={[s.input, f.multiline && s.multiline]} /></View>)}<Pressable style={s.button} onPress={() => Alert.alert("Demo only", "Details are not sent to a server yet. API integration will be added later.")}><Text style={s.buttonText}>Continue</Text></Pressable></View>}
    {sections.map((section, i) => <View key={`${i}-${section}`} style={s.card}><View style={s.cardHeader}><View style={s.number}><Text style={s.numberText}>{String(i + 1).padStart(2, "0")}</Text></View><Text style={s.cardTitle}>{section}</Text></View><Text style={s.body}>{sectionBody(section)}</Text></View>)}
    {bullets.length > 0 && <View style={s.card}>{bullets.map((b, i) => <View key={b} style={s.bulletRow}><Text style={s.check}>✓</Text><Text style={s.body}>{b}</Text></View>)}</View>}
    {actions.map(a => <Pressable key={a.label} style={s.button} onPress={() => a.route ? router.push(a.route as never) : Alert.alert(a.label, a.message || "This action will be connected to the API later.")}><Text style={s.buttonText}>{a.label}  →</Text></Pressable>)}
    <View style={s.footer}><Text style={s.footerTitle}>Care you can trust.</Text><Text style={s.footerText}>Every wash, with love. Live account data and transactions will be connected through the API later.</Text></View>
    <Pressable style={s.back} onPress={() => router.canGoBack() ? router.back() : router.replace("/" as never)}><Text style={s.backText}>← Back</Text></Pressable>
  </ScrollView>;
}
function sectionBody(section: string) {
 const text: Record<string,string> = {
  "Our story":"Lumina Laundry & Care helps make garment care simpler with convenient service, careful handling and doorstep pickup and delivery.",
  "Pickup and delivery":"Choose a service, select a convenient pickup time and keep track of your order from booking through delivery.",
  "Orders and turnaround":"Turnaround depends on the service and garment type. Order tracking and status updates will be connected to live booking data later.",
  "Payments and support":"Payment options, receipts and support history will be connected when the backend API is available.",
  "Information collected":"Account and booking information is used to support service delivery. The final privacy policy should be confirmed against the live website before release.",
  "Service terms":"Bookings, cancellations and service availability will follow the published Lumina terms. This screen is a frontend preview, not a legal document.",
  "Partnership overview":"Explore local service partnerships, operating support and the information needed for a franchise enquiry.",
  "Customer support":"Share your question through the contact form. Sending and ticket tracking are demo-only until the API is connected.",
  "Recent orders":"Your order list will appear here once the app is connected to the customer account API.",
  "Available promotions":"Promotion eligibility and discount validation must be checked by the server before checkout.",
 };
 return text[section] || `Explore ${section.toLowerCase()} here. This mobile-first screen is ready for frontend preview; live records and actions will be connected through the API later.`;
}
const s = StyleSheet.create({page:{flex:1,backgroundColor:"#F7F4EC"},content:{padding:18,paddingTop:22,paddingBottom:32,gap:14},brandRow:{flexDirection:"row",justifyContent:"space-between",alignItems:"center",paddingHorizontal:4},eyebrow:{color:"#315E45",fontSize:10,fontWeight:"900",letterSpacing:2},brand:{color:"#315E45",fontSize:26,fontWeight:"500",letterSpacing:5,marginTop:4},tagline:{color:"#6F7B70",fontSize:9,letterSpacing:3,marginTop:1},dot:{width:44,height:44,borderRadius:22,backgroundColor:"#E6EDE3",alignItems:"center",justifyContent:"center"},dotText:{color:"#315E45",fontSize:20,fontWeight:"900"},hero:{backgroundColor:"#E7EEE4",borderRadius:24,padding:22,gap:10,marginTop:4},kicker:{color:"#315E45",fontSize:10,fontWeight:"900",letterSpacing:1.5},title:{color:"#20352D",fontSize:29,fontWeight:"900",lineHeight:35},description:{color:"#66746A",fontSize:14,lineHeight:22},card:{backgroundColor:"#FFFFFF",borderRadius:18,padding:16,borderWidth:1,borderColor:"#E5E2D8",gap:12},cardHeader:{flexDirection:"row",alignItems:"center",gap:10},number:{width:34,height:34,borderRadius:12,backgroundColor:"#E7EEE4",alignItems:"center",justifyContent:"center"},numberText:{color:"#315E45",fontSize:11,fontWeight:"900"},cardTitle:{color:"#20352D",fontSize:16,fontWeight:"800",flex:1},body:{color:"#68746B",fontSize:13,lineHeight:20,flex:1},bulletRow:{flexDirection:"row",alignItems:"flex-start",gap:10},check:{color:"#315E45",fontWeight:"900",fontSize:16},fieldWrap:{gap:6},label:{color:"#20352D",fontSize:12,fontWeight:"800"},input:{backgroundColor:"#FBFCF9",borderWidth:1,borderColor:"#E0E5DD",borderRadius:12,paddingHorizontal:13,paddingVertical:12,color:"#20352D",fontSize:14},multiline:{minHeight:90,textAlignVertical:"top"},button:{backgroundColor:"#315E45",borderRadius:14,padding:15,alignItems:"center",justifyContent:"center",minHeight:50},buttonText:{color:"#FFFFFF",fontWeight:"900",fontSize:14},footer:{backgroundColor:"#20352D",borderRadius:18,padding:18,gap:6,marginTop:4},footerTitle:{color:"#F8F5EC",fontSize:17,fontWeight:"900"},footerText:{color:"#D5DFD5",fontSize:12,lineHeight:18},back:{padding:12,alignItems:"center"},backText:{color:"#315E45",fontWeight:"800"}});
'@
Set-Content 'src\components\website-page.tsx' $component -Encoding utf8

$pages = @(
 @{file='about';title='About Lumina';desc='Laundry care designed around your everyday life.';sections=@('Our story','How our service works','Care and quality');bullets=@('Doorstep pickup and delivery','Thoughtful garment care','Simple order tracking')},
 @{file='faq';title='Frequently Asked Questions';desc='Quick answers about pickup, delivery, orders and garment care.';sections=@('Pickup and delivery','Orders and turnaround','Payments and support')},
 @{file='franchise';title='Franchise Opportunities';desc='Explore a partnership with Lumina Laundry & Care.';sections=@('Partnership overview','Operating support','Enquiry details');fields=@(@{label='Full name';placeholder='Your name'},@{label='Phone';placeholder='Mobile number'},@{label='City';placeholder='Your city'},@{label='Message';placeholder='Tell us about your interest';multiline=$true})},
 @{file='terms';title='Terms and Conditions';desc='Important information about using laundry services.';sections=@('Service terms','Bookings and cancellations','Payments and liability')},
 @{file='privacy';title='Privacy Policy';desc='An overview of privacy topics for the mobile app preview.';sections=@('Information collected','How information is used','Your choices')},
 @{file='contact';title='Contact Us';desc='We are here to help with your laundry and booking questions.';sections=@('Customer support','Service enquiry');fields=@(@{label='Name';placeholder='Your name'},@{label='Email';placeholder='you@example.com'},@{label='Message';placeholder='How can we help?';multiline=$true});actions=@(@{label='Open Help & Support';route='/support'})},
 @{file='login';title='Customer Login';desc='Sign in to manage bookings, addresses and order history.';sections=@('Customer sign-in');fields=@(@{label='Email';placeholder='you@example.com'},@{label='Password';placeholder='Enter password';secure=$true});actions=@(@{label='Forgot password';route='/forgot-password'},@{label='Create account';route='/register'})},
 @{file='register';title='Create Account';desc='Create an account to manage your laundry services.';fields=@(@{label='Full name';placeholder='Your name'},@{label='Email';placeholder='you@example.com'},@{label='Phone';placeholder='Mobile number'},@{label='Password';placeholder='Create password';secure=$true});actions=@(@{label='Already have an account? Login';route='/login'})},
 @{file='forgot-password';title='Forgot Password';desc='Start account recovery. Email delivery will be connected through the API later.';fields=@(@{label='Email';placeholder='Account email'});actions=@(@{label='Back to login';route='/login'})},
 @{file='driver-login';title='Driver Login';desc='Access assigned pickups and deliveries.';fields=@(@{label='Phone or email';placeholder='Driver account'},@{label='Password';placeholder='Enter password';secure=$true});actions=@(@{label='Continue to Driver Panel';route='/driver'})},
 @{file='customer-dashboard';title='My Account';desc='Your customer account at a glance.';sections=@('Recent orders','Saved addresses','Account settings');actions=@(@{label='My orders';route='/orders'},@{label='Addresses';route='/addresses'},@{label='Profile';route='/profile'})},
 @{file='subcategories';title='Service Categories';desc='Explore laundry and garment-care options.';sections=@('Wash and fold','Dry cleaning','Special garment care');actions=@(@{label='Browse services';route='/services'})},
 @{file='promo-codes';title='Promotions';desc='Browse offers. Discount eligibility will be verified by the server later.';sections=@('Available promotions','How to apply a code')},
 @{file='contact-messages';title='Contact Messages';desc='Management view for customer enquiries.';sections=@('Open enquiries','Resolved enquiries')},
 @{file='shops';title='Shop Directory';desc='Explore laundry service locations.';sections=@('Shop directory','Shop status','Location details');actions=@(@{label='Browse services';route='/services'})},
 @{file='subscriptions';title='Subscription Plans';desc='Review plan benefits and billing information.';sections=@('Plan overview','Billing status','Plan benefits')},
 @{file='vendor-login';title='Vendor Login';desc='Sign in to manage your laundry store.';fields=@(@{label='Email';placeholder='Vendor email'},@{label='Password';placeholder='Enter password';secure=$true});actions=@(@{label='Open Vendor workspace';route='/vendor'},@{label='Register vendor';route='/vendor-register'},@{label='Forgot password';route='/vendor-forgot-password'})},
 @{file='vendor-register';title='Vendor Registration';desc='Submit your store details for onboarding.';fields=@(@{label='Owner name';placeholder='Full name'},@{label='Store name';placeholder='Laundry shop name'},@{label='Phone';placeholder='Mobile number'},@{label='Email';placeholder='Business email'},@{label='City';placeholder='City'});actions=@(@{label='Vendor login';route='/vendor-login'})},
 @{file='vendor-forgot-password';title='Vendor Password Recovery';desc='Request a password reset for your vendor account.';fields=@(@{label='Vendor email';placeholder='Business email'});actions=@(@{label='Back to vendor login';route='/vendor-login'})},
 @{file='admin-login';title='Admin Login';desc='Management workspace sign-in preview.';fields=@(@{label='Admin email';placeholder='Admin email'},@{label='Password';placeholder='Enter password';secure=$true});actions=@(@{label='Open Admin dashboard';route='/admin'})}
)
$created = 0
foreach ($page in $pages) {
  $path = "src\app\$($page.file).tsx"
  if (Test-Path $path) { continue }
  $esc = { param($v) ($v -replace '\\','\\' -replace '"','\"' -replace "`r|`n",' ') }
  $sections = @($page.sections | ForEach-Object { '"' + (& $esc $_) + '"' }) -join ', '
  $bullets = @($page.bullets | ForEach-Object { '"' + (& $esc $_) + '"' }) -join ', '
  $fields = @($page.fields | ForEach-Object { $obj = '{ label: "' + (& $esc $_.label) + '", placeholder: "' + (& $esc $_.placeholder) + '"'; if ($_.secure) { $obj += ', secure: true' }; if ($_.multiline) { $obj += ', multiline: true' }; $obj + ' }' }) -join ', '
  $actions = @($page.actions | ForEach-Object { $obj = '{ label: "' + (& $esc $_.label) + '"'; if ($_.route) { $obj += ', route: "' + (& $esc $_.route) + '"' }; $obj + ' }' }) -join ', '
  $source = @"
import React from 'react';
import WebsitePage from '@/components/website-page';
export default function Screen() {
 return <WebsitePage title="$($page.title)" description="$($page.desc)" sections={[$sections]} fields={[$fields]} actions={[$actions]} bullets={[$bullets]} />;
}
"@
  Set-Content $path $source -Encoding utf8
  $created++
}

# Add a customer-friendly link to the page catalog without replacing the existing More screen.
$catalog = @'
import React from "react";
import { ScrollView, Pressable, StyleSheet, Text } from "react-native";
import { useRouter } from "expo-router";
const pages = [
 ["About Lumina", "/about"], ["Services", "/services"], ["Stores", "/stores"], ["FAQ", "/faq"], ["Contact", "/contact"], ["Franchise", "/franchise"], ["Terms", "/terms"], ["Privacy", "/privacy"], ["Customer Login", "/login"], ["Create Account", "/register"], ["My Account", "/customer-dashboard"], ["Categories", "/categories"], ["Promotions", "/promo-codes"], ["Subscriptions", "/subscriptions"], ["Admin Login", "/admin-login"], ["Vendor Login", "/vendor-login"], ["Driver Login", "/driver-login"]
] as const;
export default function WebsitePages() { const router = useRouter(); return <ScrollView style={s.page} contentContainerStyle={s.content}><Text style={s.brand}>LUMINA LAUNDRY</Text><Text style={s.title}>Website Pages</Text><Text style={s.sub}>Mobile frontend previews. API-backed actions will be connected later.</Text>{pages.map(([label, route]) => <Pressable key={route} style={s.item} onPress={() => router.push(route as never)}><Text style={s.label}>{label}</Text><Text style={s.arrow}>›</Text></Pressable>)}</ScrollView> }
const s = StyleSheet.create({page:{flex:1,backgroundColor:"#F7F4EC"},content:{padding:18,paddingTop:28,gap:10},brand:{color:"#315E45",fontSize:11,fontWeight:"900",letterSpacing:2},title:{color:"#20352D",fontSize:29,fontWeight:"900"},sub:{color:"#68746B",fontSize:14,lineHeight:21,marginBottom:8},item:{minHeight:52,backgroundColor:"white",borderWidth:1,borderColor:"#E5E2D8",borderRadius:13,paddingHorizontal:15,flexDirection:"row",alignItems:"center",justifyContent:"space-between"},label:{color:"#20352D",fontWeight:"700"},arrow:{color:"#315E45",fontSize:23}});
'@
if (!(Test-Path 'src\app\website-pages.tsx')) { Set-Content 'src\app\website-pages.tsx' $catalog -Encoding utf8; $created++ }

# Register all newly added routes as hidden routes so the 5 customer tabs remain unchanged.
$tabsPath = 'src\components\app-tabs.tsx'
$tabs = Get-Content $tabsPath -Raw
$routeNames = @($pages | ForEach-Object { $_.file }) + @('website-pages')
$hidden = @()
foreach ($name in $routeNames) { if ($tabs -notmatch "name=`"$([regex]::Escape($name))`"") { $hidden += "      <Tabs.Screen name=`"$name`" options={{ href: null, tabBarStyle: { display: 'none' } }} />" } }
if ($hidden.Count -gt 0) { $tabs = $tabs -replace '</Tabs>', (($hidden -join "`r`n") + "`r`n    </Tabs>"); Set-Content $tabsPath $tabs -Encoding utf8 }

# Add a single link to More, if the existing More screen is present and not already linked.
if ((Test-Path 'src\app\hub.tsx') -and ((Get-Content 'src\app\hub.tsx' -Raw) -notmatch 'website-pages')) {
  $hub = Get-Content 'src\app\hub.tsx' -Raw
  $needle = '<Pressable style={s.teamButton}'
  if ($hub.Contains($needle)) {
    $insert = '<Pressable style={s.teamButton} onPress={() => router.push("/website-pages" as never)}><Text style={s.teamText}>Explore Website Pages →</Text></Pressable>' + "`r`n      "
    $hub = $hub.Replace($needle, $insert + $needle)
    Set-Content 'src\app\hub.tsx' $hub -Encoding utf8
  }
}
Write-Host "`nCreated $created missing mobile page screens. Existing app pages were preserved." -ForegroundColor Green
Write-Host "Backup folder: $backup" -ForegroundColor Cyan
Write-Host 'These screens use demo/local frontend interactions only; API integration comes later.' -ForegroundColor Yellow
Write-Host "`nRunning TypeScript check..." -ForegroundColor Cyan
npx tsc --noEmit
if ($LASTEXITCODE -ne 0) { Write-Host 'TypeScript errors found. Copy the full output so they can be fixed.' -ForegroundColor Yellow; exit $LASTEXITCODE }
Write-Host 'TypeScript check passed.' -ForegroundColor Green
Write-Host 'Restart app with: npx expo start -c' -ForegroundColor Cyan
