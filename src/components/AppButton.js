import React, { useRef } from "react";
import { Animated, Pressable, StyleSheet, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radii, spacing } from "../styles/theme";
import { useThemeMode } from "../context/ThemeContext";

export default function AppButton({
  title,
  icon,
  onPress,
  variant = "primary",
  disabled = false
}) {
  const isSoft = variant === "soft";
  const scale = useRef(new Animated.Value(1)).current;
  const { themeColors } = useThemeMode();

  function animateScale(toValue) {
    Animated.spring(scale, {
      toValue,
      friction: 5,
      tension: 130,
      useNativeDriver: true
    }).start();
  }

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={() => animateScale(0.96)}
        onPressOut={() => animateScale(1)}
        disabled={disabled}
        style={[
        styles.button,
        isSoft ? styles.softButton : styles.primaryButton,
        isSoft
          ? {
              backgroundColor: themeColors.surfaceGlass,
              borderColor: themeColors.border
            }
          : null,
        disabled ? styles.disabled : null
      ]}
      >
        {icon ? (
          <Ionicons
            name={icon}
            size={18}
            color={isSoft ? colors.primary : colors.surface}
            style={styles.icon}
          />
        ) : null}
        <Text style={[styles.text, isSoft ? styles.softText : styles.primaryText]}>
          {title}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 52,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg
  },
  icon: {
    position: "absolute",
    left: spacing.lg
  },
  primaryButton: {
    backgroundColor: colors.primary,
    shadowColor: colors.primaryDark,
    shadowOpacity: 0.22,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5
  },
  softButton: {
    backgroundColor: colors.surfaceGlass,
    borderWidth: 1,
    borderColor: colors.border
  },
  disabled: {
    opacity: 0.45
  },
  text: {
    fontWeight: "700",
    fontSize: 15
  },
  primaryText: {
    color: colors.surface
  },
  softText: {
    color: colors.primary
  }
});
