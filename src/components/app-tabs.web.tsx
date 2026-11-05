import React from "react";
import { Tabs } from "expo-router";
import { Platform, Text, View } from "react-native";
import { useAppTheme } from "@/providers/app-theme-provider";

const visibleTabs = [
  { name: "index", title: "Home", symbol: "⌂" },
  { name: "services", title: "Services", symbol: "◇" },
  { name: "orders", title: "Orders", symbol: "≡" },
  { name: "profile", title: "Profile", symbol: "○" },
] as const;

const hiddenRoutes = [
  "cart", "role-login", "webview-test", "booking", "admin", "stores", "checkout",
  "invoices", "addresses", "address-map", "favorites", "support", "notifications", "settings",
  "admin-bookings", "categories", "service-items", "coupons", "customers",
  "drivers", "commissions", "reports", "analytics", "vendor", "vendor-bookings",
  "vendor-services", "vendor-schedule", "vendor-areas", "vendor-pos", "driver",
  "driver-orders", "about", "faq", "franchise", "terms", "privacy", "contact",
  "login", "register", "forgot-password", "driver-login", "customer-dashboard",
  "subcategories", "promo-codes", "contact-messages", "shops", "subscriptions",
  "admin-login", "vendor-login", "vendor-register", "vendor-forgot-password",
  "hub", "welcome", "phone-login", "verify-otp",
] as const;

function TabIcon({
  symbol,
  color,
  focused,
  accentSoft,
}: {
  symbol: string;
  color: string;
  focused: boolean;
  accentSoft: string;
}) {
  return (
    <View
      style={{
        width: 30,
        height: 30,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 10,
        backgroundColor: focused ? accentSoft : "transparent",
      }}
    >
      <Text
        allowFontScaling={false}
        style={{
          color,
          fontSize: 22,
          lineHeight: 27,
          fontWeight: "600",
          includeFontPadding: false,
        }}
      >
        {symbol}
      </Text>
    </View>
  );
}

export default function AppTabs() {
  const { colors } = useAppTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          backgroundColor: colors.navigation,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: Platform.OS === "ios" ? 86 : 66,
          paddingTop: 5,
          paddingBottom: Platform.OS === "ios" ? 23 : 5,
          elevation: 8,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "600",
          marginTop: 1,
        },
        tabBarItemStyle: { paddingVertical: 0 },
      }}
    >
      {visibleTabs.map(({ name, title, symbol }) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            title,
            tabBarIcon: ({ color, focused }) => (
              <TabIcon
                symbol={symbol}
                color={String(color)}
                focused={focused}
                accentSoft={colors.accentSoft}
              />
            ),
          }}
        />
      ))}
      {hiddenRoutes.map((name) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{ href: null, tabBarStyle: { display: "none" } }}
        />
      ))}
    </Tabs>
  );
}
