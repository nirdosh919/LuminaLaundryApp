import React from "react";
import { Tabs } from "expo-router";
import { Platform, Text, View } from "react-native";
import { useAppTheme } from "@/providers/app-theme-provider";

const items = [
  { name: "index", title: "Home", symbol: "⌂" },
  { name: "services", title: "Services", symbol: "◇" },
  { name: "orders", title: "Orders", symbol: "≡" },
  { name: "profile", title: "Profile", symbol: "○" },
] as const;

export default function CustomerTabs() {
  const { colors } = useAppTheme();

  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: colors.primary,
      tabBarInactiveTintColor: colors.textSecondary,
      tabBarHideOnKeyboard: true,
      tabBarStyle: {
        backgroundColor: colors.navigation,
        borderTopColor: colors.border,
        borderTopWidth: 1,
        height: Platform.OS === "ios" ? 88 : 70,
        paddingTop: 8,
        paddingBottom: Platform.OS === "ios" ? 24 : 8,
        elevation: 12,
        shadowColor: colors.primary,
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      tabBarLabelStyle: { fontSize: 10, fontWeight: "700", marginTop: 2 },
    }}>
      {items.map(item => (
        <Tabs.Screen
          key={item.name}
          name={item.name}
          options={{
            title: item.title,
            tabBarIcon: ({ color, focused }) => (
              <View style={{
                width: 34, height: 30, alignItems: "center",
                justifyContent: "center", borderRadius: 12,
                backgroundColor: focused ? colors.accentSoft : "transparent",
              }}>
                <Text style={{
                  color, fontSize: 22, lineHeight: 27,
                  fontWeight: "600", includeFontPadding: false,
                }}>{item.symbol}</Text>
              </View>
            ),
          }}
        />
      ))}
    </Tabs>
  );
}

