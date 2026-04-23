import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radii, spacing } from "../styles/theme";
import FadeInView from "./FadeInView";
import { useThemeMode } from "../context/ThemeContext";

export default function MetricCard({ icon, label, value, tone = "pink", delay = 0 }) {
  const toneStyle = tone === "purple" ? styles.purple : styles.pink;
  const { themeColors } = useThemeMode();

  return (
    <FadeInView
      delay={delay}
      style={[
        styles.card,
        {
          backgroundColor: themeColors.surfaceGlass,
          borderColor: themeColors.border,
          shadowColor: themeColors.shadow
        }
      ]}
    >
      <View style={[styles.iconWrap, toneStyle]}>
        <Ionicons
          name={icon}
          size={18}
          color={tone === "purple" ? colors.secondary : colors.primary}
        />
      </View>
      <Text style={[styles.label, { color: themeColors.textSoft }]}>{label}</Text>
      <Text style={[styles.value, { color: themeColors.text }]}>{value}</Text>
    </FadeInView>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minHeight: 120,
    backgroundColor: colors.surfaceGlass,
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm
  },
  pink: {
    backgroundColor: colors.surfaceSoft
  },
  purple: {
    backgroundColor: colors.lavender
  },
  label: {
    color: colors.textSoft,
    fontSize: 13,
    marginBottom: 4
  },
  value: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "800"
  }
});
