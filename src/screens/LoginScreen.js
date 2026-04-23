import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

import AnimatedBackground from "../components/AnimatedBackground";
import AppButton from "../components/AppButton";
import Card from "../components/Card";
import FadeInView from "../components/FadeInView";
import { loginWithEmail, registerWithEmail } from "../services/authService";
import { isFirebaseConfigured } from "../services/firebase";
import { colors, spacing, type } from "../styles/theme";
import { useThemeMode } from "../context/ThemeContext";

export default function LoginScreen() {
  const { themeColors } = useThemeMode();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState("login");
  const [isBusy, setIsBusy] = useState(false);

  async function submitAuth() {
    if (!email.trim() || password.length < 6) {
      Alert.alert("Check details", "Enter an email and at least 6 password characters.");
      return;
    }

    try {
      setIsBusy(true);
      if (mode === "login") {
        await loginWithEmail(email, password);
      } else {
        await registerWithEmail(email, password);
      }
    } catch (error) {
      Alert.alert("Firebase auth", error.message);
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <SafeAreaView
      edges={["top", "bottom", "left", "right"]}
      style={[styles.safeArea, { backgroundColor: themeColors.background }]}
    >
      <AnimatedBackground />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <FadeInView style={styles.brand}>
            <View style={styles.logo}>
              <Ionicons name="heart" size={26} color={colors.surface} />
            </View>
            <Text style={[styles.appName, { color: themeColors.text }]}>HerCycle</Text>
            <Text style={[styles.subtitle, { color: themeColors.textSoft }]}>Sign in to sync your cycle data securely.</Text>
          </FadeInView>

          <Card style={styles.card} delay={120}>
            <Text style={[styles.title, { color: themeColors.text }]}>
              {mode === "login" ? "Welcome back" : "Create account"}
            </Text>

            {!isFirebaseConfigured ? (
              <View style={styles.warning}>
                <Ionicons name="warning" size={18} color={colors.warning} />
                <Text style={styles.warningText}>
                  Add your Firebase config values before login will work.
                </Text>
              </View>
            ) : (
              <View style={styles.notice}>
                <Ionicons name="cloud-done" size={18} color={colors.secondary} />
                <Text style={styles.noticeText}>
                  If Firebase rejects the API key, HerCycle will open in local mode.
                </Text>
              </View>
            )}

            <Text style={[styles.label, { color: themeColors.text }]}>Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="you@example.com"
              placeholderTextColor={colors.muted}
              style={styles.input}
            />

            <Text style={[styles.label, { color: themeColors.text }]}>Password</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="Minimum 6 characters"
              placeholderTextColor={colors.muted}
              style={styles.input}
            />

            <AppButton
              title={isBusy ? "Please wait" : mode === "login" ? "Login" : "Sign Up"}
              icon={mode === "login" ? "log-in" : "person-add"}
              onPress={submitAuth}
              disabled={isBusy || !isFirebaseConfigured}
            />

            <AppButton
              title={
                mode === "login"
                  ? "Create a new account"
                  : "I already have an account"
              }
              icon="swap-horizontal"
              variant="soft"
              onPress={() => setMode(mode === "login" ? "signup" : "login")}
            />
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background
  },
  container: {
    flex: 1
  },
  content: {
    flexGrow: 1,
    justifyContent: "center",
    padding: spacing.lg,
    gap: spacing.lg
  },
  brand: {
    alignItems: "center"
  },
  logo: {
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    marginBottom: spacing.sm,
    shadowColor: colors.primaryDark,
    shadowOpacity: 0.25,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 7
  },
  appName: {
    color: colors.text,
    fontSize: 34,
    fontWeight: "900"
  },
  subtitle: {
    color: colors.textSoft,
    fontSize: type.body,
    fontWeight: "700",
    textAlign: "center",
    marginTop: spacing.xs
  },
  card: {
    gap: spacing.md
  },
  title: {
    color: colors.text,
    fontSize: type.title,
    fontWeight: "900"
  },
  warning: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: 16,
    backgroundColor: colors.peach
  },
  warningText: {
    flex: 1,
    color: colors.text,
    fontWeight: "700",
    lineHeight: 20
  },
  notice: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: 16,
    backgroundColor: colors.lavender
  },
  noticeText: {
    flex: 1,
    color: colors.text,
    fontWeight: "700",
    lineHeight: 20
  },
  label: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "800"
  },
  input: {
    minHeight: 54,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSoft,
    paddingHorizontal: spacing.md,
    color: colors.text,
    fontSize: type.body,
    fontWeight: "700"
  }
});
