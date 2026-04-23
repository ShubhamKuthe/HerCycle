import React from "react";
import { StyleSheet } from "react-native";
import { colors, radii, spacing } from "../styles/theme";
import FadeInView from "./FadeInView";
import { useThemeMode } from "../context/ThemeContext";

export default function Card({ children, style, delay = 0 }) {
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
        },
        style
      ]}
    >
      {children}
    </FadeInView>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceGlass,
    borderRadius: radii.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOpacity: 0.1,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 },
    elevation: 5
  }
});
