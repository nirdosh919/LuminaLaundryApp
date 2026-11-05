import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { dashboardForRole, signIn } from "@/lib/auth";
import { useRoleAccess } from "@/providers/role-access-provider";
import { LuminaLogo } from "@/components/brand-ui";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function LoginScreen() {
  const { activateRole } = useRoleAccess();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const logoScale = useState(() => new Animated.Value(0.7))[0];
  const logoOpacity = useState(() => new Animated.Value(0))[0];
  const headingOpacity = useState(() => new Animated.Value(0))[0];
  const headingY = useState(() => new Animated.Value(22))[0];
  const formOpacity = useState(() => new Animated.Value(0))[0];
  const formY = useState(() => new Animated.Value(28))[0];
  const footerOpacity = useState(() => new Animated.Value(0))[0];
  const orbRotation = useState(() => new Animated.Value(0))[0];
  const buttonScale = useState(() => new Animated.Value(1))[0];
  const emailBorder = useState(() => new Animated.Value(0))[0];
  const passwordBorder = useState(() => new Animated.Value(0))[0];

  useEffect(() => {
    const entrance = Animated.sequence([
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 450,
          useNativeDriver: true,
        }),
        Animated.spring(logoScale, {
          toValue: 1,
          damping: 12,
          stiffness: 120,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(headingOpacity, {
          toValue: 1,
          duration: 420,
          useNativeDriver: true,
        }),
        Animated.timing(headingY, {
          toValue: 0,
          duration: 520,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(formOpacity, {
          toValue: 1,
          duration: 450,
          useNativeDriver: true,
        }),
        Animated.spring(formY, {
          toValue: 0,
          damping: 17,
          stiffness: 100,
          useNativeDriver: true,
        }),
        Animated.timing(footerOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
    ]);

    entrance.start();

    const floating = Animated.loop(
      Animated.sequence([
        Animated.timing(orbRotation, {
          toValue: 1,
          duration: 3200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(orbRotation, {
          toValue: 0,
          duration: 3200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    floating.start();

    return () => {
      entrance.stop();
      floating.stop();
    };
  }, [
    logoScale,
    logoOpacity,
    headingOpacity,
    headingY,
    formOpacity,
    formY,
    footerOpacity,
    orbRotation,
  ]);

  useEffect(() => {
    Animated.timing(emailBorder, {
      toValue: emailFocused ? 1 : 0,
      duration: 180,
      useNativeDriver: false,
    }).start();
  }, [emailFocused, emailBorder]);

  useEffect(() => {
    Animated.timing(passwordBorder, {
      toValue: passwordFocused ? 1 : 0,
      duration: 180,
      useNativeDriver: false,
    }).start();
  }, [passwordFocused, passwordBorder]);

  const login = async () => {
    const cleanEmail = email.trim();

    if (!/^\S+@\S+\.\S+$/.test(cleanEmail) || !password) {
      Alert.alert(
        "Check your details",
        "Enter a valid email address and password."
      );
      return;
    }

    setBusy(true);

    try {
      const account = await signIn("customer", cleanEmail, password);
      activateRole(account.role);
      router.replace(dashboardForRole(account.role) as never);
    } catch (error) {
      Alert.alert(
        "Sign-in failed",
        error instanceof Error ? error.message : "Please try again."
      );
    } finally {
      setBusy(false);
    }
  };

  const orbTranslateY = orbRotation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -9],
  });

  const orbScale = orbRotation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 1.04, 1],
  });

  const focusBorderColor = (value: Animated.Value) =>
    value.interpolate({
      inputRange: [0, 1],
      outputRange: ["#DDE5DF", "#3E755F"],
    });

  const pressIn = () => {
    Animated.spring(buttonScale, {
      toValue: 0.975,
      speed: 30,
      bounciness: 4,
      useNativeDriver: true,
    }).start();
  };

  const pressOut = () => {
    Animated.spring(buttonScale, {
      toValue: 1,
      speed: 22,
      bounciness: 5,
      useNativeDriver: true,
    }).start();
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={[
              styles.brandRow,
              {
                opacity: logoOpacity,
                transform: [{ scale: logoScale }],
              },
            ]}
          >
            <LuminaLogo height={48} />
          </Animated.View>

          <Animated.View
            style={[
              styles.heading,
              {
                opacity: headingOpacity,
                transform: [{ translateY: headingY }],
              },
            ]}
          >
            <View style={styles.eyebrowRow}>
              <View style={styles.accentLine} />
              <Text style={styles.eyebrow}>WELCOME BACK</Text>
            </View>

            <Text style={styles.title}>
              Your laundry,{"\n"}
              <Text style={styles.titleAccent}>made effortless.</Text>
            </Text>

            <Text style={styles.subtitle}>
              A little care goes a long way. Sign in to manage your orders and
              schedule your next pickup.
            </Text>

            <View style={styles.decorArea} pointerEvents="none">
              <Animated.View
                style={[
                  styles.decorOrb,
                  {
                    transform: [
                      { translateY: orbTranslateY },
                      { scale: orbScale },
                    ],
                  },
                ]}
              >
                <View style={styles.orbInner} />
              </Animated.View>
              <Text style={styles.decorSparkle}>✳</Text>
              <View style={styles.decorDot} />
            </View>
          </Animated.View>

          <Animated.View
            style={[
              styles.form,
              {
                opacity: formOpacity,
                transform: [{ translateY: formY }],
              },
            ]}
          >
            <View style={styles.formHeading}>
              <Text style={styles.formTitle}>Sign in</Text>
              <Text style={styles.formHint}>Your account awaits.</Text>
            </View>

            <Text style={styles.label}>EMAIL ADDRESS</Text>

            <Animated.View
              style={[
                styles.inputContainer,
                { borderColor: focusBorderColor(emailBorder) },
              ]}
            >
              <Text style={styles.fieldIcon}>✉</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
                placeholder="name@example.com"
                placeholderTextColor="#6F7D75"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                textContentType="emailAddress"
                returnKeyType="next"
                style={styles.input}
                accessibilityLabel="Email address"
              />
              {email.length > 0 && /^\S+@\S+\.\S+$/.test(email.trim()) ? (
                <Text style={styles.validMark}>✓</Text>
              ) : null}
            </Animated.View>

            <View style={styles.passwordHeading}>
              <Text style={styles.label}>PASSWORD</Text>
              <Pressable
                onPress={() => router.push("/forgot-password")}
                accessibilityRole="button"
                hitSlop={8}
              >
                <Text style={styles.forgot}>Forgot password?</Text>
              </Pressable>
            </View>

            <Animated.View
              style={[
                styles.inputContainer,
                { borderColor: focusBorderColor(passwordBorder) },
              ]}
            >
              <Text style={styles.fieldIcon}>⌑</Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
                placeholder="Enter your password"
                placeholderTextColor="#6F7D75"
                secureTextEntry={!showPassword}
                autoComplete="current-password"
                textContentType="password"
                autoCapitalize="none"
                returnKeyType="done"
                onSubmitEditing={() => void login()}
                style={styles.input}
                accessibilityLabel="Password"
              />
              <Pressable
                onPress={() => setShowPassword((value) => !value)}
                accessibilityRole="button"
                accessibilityLabel={
                  showPassword ? "Hide password" : "Show password"
                }
                hitSlop={10}
                style={styles.showPassword}
              >
                <Text style={styles.showPasswordText}>
                  {showPassword ? "Hide" : "Show"}
                </Text>
              </Pressable>
            </Animated.View>

            <AnimatedPressable
              accessibilityRole="button"
              disabled={busy}
              onPress={() => void login()}
              onPressIn={pressIn}
              onPressOut={pressOut}
              style={[
                styles.signInButton,
                { transform: [{ scale: buttonScale }] },
                busy && styles.signInDisabled,
              ]}
            >
              {busy ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.signInText}>Sign in</Text>
                  <View style={styles.buttonArrowCircle}>
                    <Text style={styles.signInArrow}>→</Text>
                  </View>
                </>
              )}
            </AnimatedPressable>

            <View style={styles.registerRow}>
              <Text style={styles.registerText}>New to Lumina? </Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push("/register")}
                hitSlop={8}
              >
                <Text style={styles.registerLink}>Create an account ↗</Text>
              </Pressable>
            </View>
          </Animated.View>

          <Animated.View style={[styles.footer, { opacity: footerOpacity }]}>
            <View style={styles.footerLine} />
            <Text style={styles.footerText}>
              THOUGHTFUL CARE. BEAUTIFULLY SIMPLE.
            </Text>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#F7F5F0",
  },
  keyboard: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 25,
    paddingTop: 25,
    paddingBottom: 22,
    justifyContent: "center",
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  logo: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: "#2B5445",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  logoText: {
    color: "#EDCB88",
    fontSize: 29,
    fontWeight: "700",
    fontFamily: "serif",
  },
  logoDot: {
    position: "absolute",
    width: 7,
    height: 7,
    borderRadius: 4,
    right: 8,
    top: 8,
    backgroundColor: "#3E755F",
  },
  brand: {
    color: "#2B5445",
    fontSize: 17,
    fontWeight: "900",
    letterSpacing: 3,
  },
  brandSub: {
    color: "#6F7D75",
    fontSize: 8,
    fontWeight: "700",
    letterSpacing: 2,
    marginTop: 4,
  },
  brandAccent: {
    marginLeft: "auto",
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#E9F1ED",
    alignItems: "center",
    justifyContent: "center",
  },
  brandAccentText: {
    color: "#3E755F",
    fontSize: 20,
  },
  heading: {
    marginTop: 49,
    marginBottom: 27,
    position: "relative",
  },
  eyebrowRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    marginBottom: 15,
  },
  accentLine: {
    width: 24,
    height: 2,
    borderRadius: 2,
    backgroundColor: "#E9F1ED",
  },
  eyebrow: {
    color: "#3E755F",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 2,
  },
  title: {
    color: "#1E2B24",
    fontSize: 34,
    lineHeight: 41,
    fontWeight: "700",
    letterSpacing: -0.8,
  },
  titleAccent: {
    color: "#3E755F",
    fontFamily: "serif",
    fontStyle: "italic",
    fontWeight: "600",
  },
  subtitle: {
    color: "#6F7D75",
    fontSize: 12,
    lineHeight: 19,
    marginTop: 13,
    maxWidth: 290,
    paddingRight: 10,
  },
  decorArea: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: 96,
    height: 115,
    alignItems: "center",
    justifyContent: "center",
  },
  decorOrb: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "#E9F1ED",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#DDE5DF",
  },
  orbInner: {
    width: 43,
    height: 43,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#3E755F",
    backgroundColor: "rgba(255,255,255,0.32)",
  },
  decorSparkle: {
    position: "absolute",
    color: "#3E755F",
    fontSize: 23,
    right: 1,
    top: 1,
  },
  decorDot: {
    position: "absolute",
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#E9F1ED",
    left: 4,
    bottom: 9,
  },
  form: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DDE5DF",
    borderRadius: 22,
    padding: 20,
    shadowColor: "#2B5445",
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.055,
    shadowRadius: 16,
    elevation: 3,
  },
  formHeading: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  formTitle: {
    color: "#1E2B24",
    fontSize: 21,
    fontWeight: "800",
    letterSpacing: -0.4,
  },
  formHint: {
    color: "#6F7D75",
    fontSize: 10,
  },
  label: {
    color: "#6F7D75",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  inputContainer: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DDE5DF",
    borderRadius: 12,
    paddingHorizontal: 13,
    marginBottom: 20,
  },
  fieldIcon: {
    width: 22,
    color: "#3E755F",
    fontSize: 16,
    textAlign: "center",
    marginRight: 7,
  },
  input: {
    flex: 1,
    minWidth: 0,
    color: "#1E2B24",
    fontSize: 13,
    paddingVertical: 14,
  },
  validMark: {
    color: "#3E755F",
    fontSize: 14,
    fontWeight: "900",
    marginLeft: 5,
  },
  passwordHeading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  forgot: {
    color: "#3E755F",
    fontSize: 10,
    fontWeight: "800",
  },
  showPassword: {
    paddingLeft: 10,
    paddingVertical: 10,
  },
  showPasswordText: {
    color: "#3E755F",
    fontSize: 10,
    fontWeight: "800",
  },
  signInButton: {
    minHeight: 53,
    backgroundColor: "#2B5445",
    borderRadius: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
    marginTop: 2,
    shadowColor: "#2B5445",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 8,
    elevation: 3,
  },
  signInDisabled: {
    opacity: 0.7,
  },
  signInText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },
  buttonArrowCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 11,
  },
  signInArrow: {
    color: "#FFFFFF",
    fontSize: 16,
    lineHeight: 20,
  },
  registerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "wrap",
    marginTop: 22,
  },
  registerText: {
    color: "#6F7D75",
    fontSize: 11,
  },
  registerLink: {
    color: "#3E755F",
    fontSize: 11,
    fontWeight: "900",
  },
  footer: {
    alignItems: "center",
    marginTop: 29,
  },
  footerLine: {
    width: 29,
    height: 1,
    backgroundColor: "#C6D0B8",
    marginBottom: 10,
  },
  footerText: {
    color: "#6F7D75",
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 1.3,
    textAlign: "center",
  },
});
