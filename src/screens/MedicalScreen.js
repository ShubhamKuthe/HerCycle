import React from "react";
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

import AnimatedBackground from "../components/AnimatedBackground";
import Card from "../components/Card";
import FadeInView from "../components/FadeInView";
import { colors, spacing, type } from "../styles/theme";
import { useThemeMode } from "../context/ThemeContext";

const mapActions = [
  {
    icon: "medkit",
    title: "Nearby medical stores",
    subtitle: "Open Google Maps and search around your current area.",
    query: "medical stores near me"
  },
  {
    icon: "bag-handle",
    title: "Pads nearby",
    subtitle: "Find stores that may carry sanitary pads.",
    query: "sanitary pads near me"
  },
  {
    icon: "business",
    title: "Pharmacies open now",
    subtitle: "Useful when you need supplies urgently.",
    query: "pharmacy open now near me"
  }
];

function openMaps(query) {
  const encodedQuery = encodeURIComponent(query);
  Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodedQuery}`);
}

export default function MedicalScreen() {
  const { themeColors } = useThemeMode();

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={[styles.safeArea, { backgroundColor: themeColors.background }]}
    >
      <AnimatedBackground />
      <ScrollView contentContainerStyle={styles.content}>
        <FadeInView>
          <Text style={styles.eyebrow}>Nearby help</Text>
          <Text style={[styles.title, { color: themeColors.text }]}>Medical stores</Text>
          <Text style={[styles.subtitle, { color: themeColors.textSoft }]}>
            Use Google Maps to find pads, pharmacies, and medical stores near you.
          </Text>
        </FadeInView>

        {mapActions.map((action, index) => (
          <Pressable
            key={action.title}
            onPress={() => openMaps(action.query)}
            style={({ pressed }) => (pressed ? styles.pressed : null)}
          >
            <Card delay={90 + index * 60}>
              <View style={styles.row}>
                <View style={styles.iconCircle}>
                  <Ionicons name={action.icon} size={22} color={colors.primary} />
                </View>
                <View style={styles.textBlock}>
                  <Text style={[styles.cardTitle, { color: themeColors.text }]}>{action.title}</Text>
                  <Text style={[styles.cardText, { color: themeColors.textSoft }]}>{action.subtitle}</Text>
                </View>
                <Ionicons name="navigate" size={21} color={colors.secondary} />
              </View>
            </Card>
          </Pressable>
        ))}

        <View style={styles.tip}>
          <Ionicons name="information-circle" size={20} color={colors.primary} />
          <Text style={styles.tipText}>
            Google Maps may ask for location permission. Store hours and stock depend on each shop.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background
  },
  content: {
    padding: spacing.lg,
    gap: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: 176
  },
  eyebrow: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  title: {
    color: colors.text,
    fontSize: type.title,
    fontWeight: "900"
  },
  subtitle: {
    color: colors.textSoft,
    fontSize: type.body,
    lineHeight: 23,
    fontWeight: "600"
  },
  pressed: {
    transform: [{ scale: 0.99 }]
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceSoft
  },
  textBlock: {
    flex: 1
  },
  cardTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900"
  },
  cardText: {
    color: colors.textSoft,
    lineHeight: 21,
    fontWeight: "600",
    marginTop: 4
  },
  tip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderRadius: 20,
    padding: spacing.md,
    backgroundColor: colors.mint
  },
  tipText: {
    flex: 1,
    color: colors.text,
    fontWeight: "700",
    lineHeight: 21
  }
});
