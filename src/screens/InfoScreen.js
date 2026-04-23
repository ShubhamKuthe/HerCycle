import React from "react";
import {
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

import AnimatedBackground from "../components/AnimatedBackground";
import Card from "../components/Card";
import FadeInView from "../components/FadeInView";
import { colors, spacing, type } from "../styles/theme";
import { useThemeMode } from "../context/ThemeContext";

const resources = [
  {
    icon: "medical",
    title: "WHO PCOS fact sheet",
    source: "World Health Organization",
    body:
      "Current overview of PCOS symptoms, long-term health risks, diagnosis, and treatment options.",
    url: "https://www.who.int/news-room/fact-sheets/detail/polycystic-ovary-syndrome"
  },
  {
    icon: "female",
    title: "PCOS FAQ",
    source: "ACOG",
    body:
      "Patient-friendly explanation of PCOS signs, irregular periods, excess hair growth, acne, and care options.",
    url: "https://www.acog.org/womens-health/faqs/polycystic-ovary-syndrome-pcos"
  },
  {
    icon: "water",
    title: "Menstrual hygiene",
    source: "CDC",
    body:
      "Practical guidance on menstrual hygiene, changing products regularly, comfort, odor, and infection prevention.",
    url: "https://www.cdc.gov/hygiene/about/menstrual-hygiene.html"
  },
  {
    icon: "heart",
    title: "PCOS fact sheet",
    source: "Office on Women's Health",
    body:
      "US health information covering PCOS symptoms, diagnosis, treatments, and questions to ask a clinician.",
    url: "https://www.womenshealth.gov/a-z-topics/polycystic-ovary-syndrome"
  },
  {
    icon: "bag",
    title: "Menstrual hygiene products",
    source: "UNICEF",
    body:
      "Information about menstrual materials and hygiene supplies used for safe, dignified period care.",
    url: "https://www.unicef.org/supply/menstrual-hygiene-products"
  }
];

function openUrl(url) {
  Linking.openURL(url);
}

export default function InfoScreen() {
  const { themeColors } = useThemeMode();

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={[styles.safeArea, { backgroundColor: themeColors.background }]}
    >
      <AnimatedBackground />
      <ScrollView contentContainerStyle={styles.content}>
        <FadeInView>
          <Text style={styles.eyebrow}>Internet resources</Text>
          <Text style={[styles.title, { color: themeColors.text }]}>Learn</Text>
          <Text style={[styles.subtitle, { color: themeColors.textSoft }]}>
            Curated links from trusted health organizations. Open any card to read the full source online.
          </Text>
        </FadeInView>

        {resources.map((resource, index) => (
          <Pressable
            key={resource.url}
            onPress={() => openUrl(resource.url)}
            style={({ pressed }) => (pressed ? styles.pressed : null)}
          >
            <Card delay={80 + index * 55}>
              <View style={styles.cardHeader}>
                <View style={styles.iconCircle}>
                  <Ionicons name={resource.icon} size={20} color={colors.primary} />
                </View>
                <View style={styles.headerText}>
                  <Text style={[styles.sectionTitle, { color: themeColors.text }]}>{resource.title}</Text>
                  <Text style={styles.source}>{resource.source}</Text>
                </View>
                <Ionicons name="open-outline" size={20} color={colors.primary} />
              </View>
              <Text style={[styles.body, { color: themeColors.textSoft }]}>{resource.body}</Text>
            </Card>
          </Pressable>
        ))}

        <FadeInView style={styles.note} delay={360}>
          <Text style={styles.noteText}>
            HerCycle opens these sources on the internet. It does not diagnose PCOD/PCOS or replace medical care.
          </Text>
        </FadeInView>
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
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.sm
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceSoft
  },
  headerText: {
    flex: 1
  },
  sectionTitle: {
    color: colors.text,
    fontSize: type.subtitle,
    fontWeight: "900"
  },
  source: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "800",
    marginTop: 2
  },
  body: {
    color: colors.textSoft,
    fontSize: 15,
    lineHeight: 23,
    fontWeight: "600"
  },
  note: {
    borderRadius: 20,
    backgroundColor: colors.lavender,
    padding: spacing.md
  },
  noteText: {
    color: colors.text,
    lineHeight: 22,
    fontWeight: "700"
  }
});
