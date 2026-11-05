$ErrorActionPreference = 'Stop'
$project = Join-Path $env:USERPROFILE 'Projects\LuminaLaundryApp'
if (!(Test-Path (Join-Path $project 'src\app\_layout.tsx'))) {
  throw "LuminaLaundryApp not found at $project. Open the correct project folder first."
}
Set-Location $project
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$backup = Join-Path $project "_website-pages-backup-$stamp"
New-Item -ItemType Directory -Force -Path $backup | Out-Null
Copy-Item 'src\components\app-tabs.tsx' (Join-Path $backup 'app-tabs.tsx')

# Shared native screen for website pages that did not yet have an app route.
$component = @'
import React from "react";
import { ScrollView, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";

type Action = { label: string; route: string };
type Props = { title: string; eyebrow?: string; description: string; sections?: string[]; actions?: Action[] };
export default function WebsitePage({ title, eyebrow = "LUMINA LAUNDRY", description, sections = [], actions = [] }: Props) {
  const router = useRouter();
  return <ScrollView style={s.page} contentContainerStyle={s.content}>
    <Text style={s.eyebrow}>{eyebrow}</Text>
    <Text style={s.title}>{title}</Text>
    <Text style={s.description}>{description}</Text>
    {sections.map((section, i) => <View key={`${i}-${section}`} style={s.card}>
      <Text style={s.sectionTitle}>{section}</Text>
      <Text style={s.body}>Explore this section in the Lumina Laundry app. Live account data and transactions will be connected through the website API.</Text>
    </View>)}
    {actions.map(a => <Pressable key={a.route} style={s.button} onPress={() => router.push(a.route as never)}><Text style={s.buttonText}>{a.label}  →</Text></Pressable>)}
    <Pressable style={s.back} onPress={() => router.back()}><Text style={s.backText}>Back</Text></Pressable>
  </ScrollView>;
}
const s = StyleSheet.create({ page:{flex:1,backgroundColor:"#F7F4EC"},content:{padding:20,paddingTop:28,gap:14},eyebrow:{color:"#315E45",fontSize:11,fontWeight:"900",letterSpacing:2},title:{color:"#20352D",fontSize:30,fontWeight:"900"},description:{color:"#68746B",fontSize:15,lineHeight:23,marginBottom:4},card:{backgroundColor:"#FFFFFF",borderRadius:16,padding:16,borderWidth:1,borderColor:"#E5E2D8",gap:7},sectionTitle:{color:"#20352D",fontSize:17,fontWeight:"800"},body:{color:"#68746B",fontSize:14,lineHeight:21},button:{backgroundColor:"#315E45",borderRadius:13,padding:15,alignItems:"center"},buttonText:{color:"#FFFFFF",fontWeight:"800"},back:{padding:12,alignItems:"center"},backText:{color:"#315E45",fontWeight:"800"}});
'@
$componentPath = 'src\components\website-page.tsx'
if (Test-Path $componentPath) { Copy-Item $componentPath (Join-Path $backup 'website-page.tsx') }
Set-Content $componentPath $component -Encoding utf8

# Create missing app counterparts for public pages and web routes not represented yet.
$pages = @(
  @{file='about'; title='About Lumina'; desc='Learn about Lumina Laundry and our laundry-care service.'; sections=@('Our story','How our service works','Care and quality')},
  @{file='faq'; title='Frequently Asked Questions'; desc='Answers about pickup, delivery, turnaround times, payments and garment care.'; sections=@('Pickup and delivery','Orders and turnaround','Payments and support')},
  @{file='franchise'; title='Franchise Opportunities'; desc='Explore partnership and franchise enquiries with Lumina Laundry.'; sections=@('Partnership overview','Operating support','Enquiry details')},
  @{file='terms'; title='Terms and Conditions'; desc='Review the terms that apply when using Lumina Laundry services.'; sections=@('Service terms','Bookings and cancellations','Payments and liability')},
  @{file='privacy'; title='Privacy Policy'; desc='Understand how account and service information is handled.'; sections=@('Information collected','How information is used','Your choices')},
  @{file='contact'; title='Contact Us'; desc='Get help with bookings, laundry services or general enquiries.'; sections=@('Customer support','Service enquiry','Business enquiry'); actions=@(@{label='Open Support';route='/support'})},
  @{file='login'; title='Customer Login'; desc='Sign in to manage bookings, saved addresses and order history.'; sections=@('Customer sign-in'); actions=@(@{label='Continue to role login';route='/role-login'},@{label='Create account';route='/register'})},
  @{file='register'; title='Create Account'; desc='Create your Lumina Laundry customer account.'; sections=@('Account details'); actions=@(@{label='Continue to sign-in';route='/role-login'})},
  @{file='forgot-password'; title='Reset Password'; desc='Start the password recovery process for your account.'; sections=@('Password recovery'); actions=@(@{label='Back to login';route='/login'})},
  @{file='driver-login'; title='Driver Login'; desc='Driver workspace for assigned pickups and deliveries.'; sections=@('Driver access'); actions=@(@{label='Continue as Driver';route='/role-login?role=driver'})},
  @{file='customer-dashboard'; title='My Account'; desc='A summary of your customer account and recent activity.'; sections=@('Recent orders','Saved addresses','Account settings'); actions=@(@{label='My orders';route='/orders'},@{label='Addresses';route='/addresses'})},
  @{file='subcategories'; title='Service Categories'; desc='Browse the available laundry and garment-care categories.'; sections=@('Wash and fold','Dry cleaning','Special garment care'); actions=@(@{label='Browse services';route='/services'})},
  @{file='promo-codes'; title='Promotions'; desc='View promotional offers available for eligible services.'; sections=@('Available promotions','How to apply a code')},
  @{file='contact-messages'; title='Contact Messages'; desc='Review customer enquiries in the management workspace.'; sections=@('Open enquiries','Resolved enquiries')},
  @{file='shops'; title='Shop Management'; desc='Manage laundry shops and service locations.'; sections=@('Shop directory','Shop status','Location details')},
  @{file='subscriptions'; title='Subscription Plans'; desc='Review available subscription plans and account status.'; sections=@('Plan overview','Billing status','Plan benefits')}
)
$created = 0
foreach ($page in $pages) {
  $path = "src\app\$($page.file).tsx"
  if (Test-Path $path) { continue }
  $sections = @($page.sections | ForEach-Object { '"' + ($_ -replace '\\','\\' -replace '"','\"') + '"' }) -join ', '
  $actions = '[]'
  if ($page.actions) {
    $actions = '[' + (@($page.actions | ForEach-Object { '{ label: "' + $_.label + '", route: "' + $_.route + '" }' }) -join ', ') + ']'
  }
  $source = "import React from 'react';`r`nimport WebsitePage from '@/components/website-page';`r`n`r`nexport default function Screen() {`r`n  return <WebsitePage title=`"$($page.title)`" description=`"$($page.desc)`" sections={[$sections]} actions={$actions} />;`r`n}`r`n"
  Set-Content $path $source -Encoding utf8
  $created++
}

# Register the new pages as hidden routes so customer tabs stay unchanged.
$tabsPath = 'src\components\app-tabs.tsx'
$tabs = Get-Content $tabsPath -Raw
$newNames = @($pages | ForEach-Object { $_.file })
$hidden = @()
foreach ($name in $newNames) {
  if ($tabs -notmatch "name=`"$([regex]::Escape($name))`"") {
    $hidden += "      <Tabs.Screen name=`"$name`" options={{ href: null, tabBarStyle: { display: 'none' } }} />"
  }
}
if ($hidden.Count -gt 0) {
  $insert = ($hidden -join "`r`n") + "`r`n"
  $tabs = $tabs -replace '</Tabs>', ($insert + '    </Tabs>')
  Set-Content $tabsPath $tabs -Encoding utf8
}

Write-Host "`nCreated $created missing page screens. Existing screens were preserved." -ForegroundColor Green
Write-Host "Backup: $backup" -ForegroundColor Cyan
Write-Host "Checking TypeScript..." -ForegroundColor Cyan
npx tsc --noEmit
if ($LASTEXITCODE -ne 0) { Write-Host 'TypeScript reported errors above; share that output to fix them.' -ForegroundColor Yellow; exit $LASTEXITCODE }
Write-Host 'TypeScript check passed.' -ForegroundColor Green
Write-Host 'Run: npx expo start -c' -ForegroundColor Cyan
