import { Redirect, Stack, useSegments } from "expo-router";
import React from "react";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import {
  AppThemeProvider,
  useAppTheme,
} from "@/providers/app-theme-provider";
import { RoleAccessProvider, useRoleAccess } from "@/providers/role-access-provider";
import { canRoleAccessRoute, isPublicRoute } from "@/lib/route-access";
import { dashboardForRole } from "@/lib/auth";
import { RoleLogoutButton } from "@/components/role-logout-button";

const authEntrySegments = new Set([
  "", "index", "welcome", "role-login", "login", "register",
  "forgot-password", "verify-otp", "phone-login", "vendor-login",
  "admin-login", "driver-login", "vendor-forgot-password", "vendor-register",
]);

export default function RootLayout() {
  return (
    <AppThemeProvider>
      <RoleAccessProvider>
        <ThemedNavigation />
      </RoleAccessProvider>
    </AppThemeProvider>
  );
}

function ThemedNavigation() {
  const { colors, effectiveMode } = useAppTheme();
  const {
    role,
    sessionReady,
    sessionError,
    retrySessionRestore,
    continueSignedOut,
  } = useRoleAccess();
  const segments = useSegments();
  const routeSegment = segments[0] ?? "";
  if (!sessionReady) {
    return (
      <View style={[styles.sessionState, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
        <Text style={{ color: colors.textSecondary }}>Checking your saved session…</Text>
      </View>
    );
  }
  if (sessionError) {
    return (
      <View style={[styles.sessionState, { backgroundColor: colors.background }]}>
        <Text style={[styles.sessionTitle, { color: colors.text }]}>
          Could not verify your saved session
        </Text>
        <Text style={[styles.sessionMessage, { color: colors.textSecondary }]}>
          {sessionError}
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={retrySessionRestore}
          style={[styles.sessionButton, { backgroundColor: colors.primary }]}
        >
          <Text style={[styles.sessionButtonText, { color: colors.onPrimary }]}>
            Try again
          </Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={continueSignedOut}>
          <Text style={[styles.sessionLink, { color: colors.primary }]}>
            Continue to sign in
          </Text>
        </Pressable>
      </View>
    );
  }
  if (role && authEntrySegments.has(routeSegment)) {
    return <Redirect href={dashboardForRole(role) as never} />;
  }
  if (!role && !isPublicRoute(routeSegment)) return <Redirect href="/role-login" />;
  if (role && !canRoleAccessRoute(role, routeSegment)) {
    return <Redirect href={dashboardForRole(role) as never} />;
  }

  return (
    <>
      <StatusBar style={effectiveMode === "dark" ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="welcome" />
        <Stack.Screen name="role-login" />
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
        <Stack.Screen name="verify-otp" />
      </Stack>
      {role && (role === "admin" || role === "driver") && routeSegment === role ? (
        <RoleLogoutButton floating />
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  sessionState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 12,
  },
  sessionTitle: { fontSize: 18, fontWeight: "800", textAlign: "center" },
  sessionMessage: { fontSize: 13, lineHeight: 19, textAlign: "center" },
  sessionButton: { borderRadius: 12, paddingHorizontal: 20, paddingVertical: 13 },
  sessionButtonText: { fontSize: 13, fontWeight: "800" },
  sessionLink: { fontSize: 12, fontWeight: "700", padding: 10 },
});
