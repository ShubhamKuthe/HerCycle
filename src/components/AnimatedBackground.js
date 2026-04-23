import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../styles/theme";
import { useThemeMode } from "../context/ThemeContext";

function FloatingShape({ delay, duration, icon, size, style, color }) {
  const float = useRef(new Animated.Value(0)).current;
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(float, {
            toValue: 1,
            duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true
          }),
          Animated.timing(spin, {
            toValue: 1,
            duration,
            easing: Easing.linear,
            useNativeDriver: true
          })
        ]),
        Animated.parallel([
          Animated.timing(float, {
            toValue: 0,
            duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true
          }),
          Animated.timing(spin, {
            toValue: 0,
            duration,
            easing: Easing.linear,
            useNativeDriver: true
          })
        ])
      ])
    ).start();
  }, [delay, duration, float, spin]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.shape,
        style,
        {
          transform: [
            {
              translateY: float.interpolate({
                inputRange: [0, 1],
                outputRange: [0, -22]
              })
            },
            {
              translateX: float.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 12]
              })
            },
            {
              rotate: spin.interpolate({
                inputRange: [0, 1],
                outputRange: ["0deg", "9deg"]
              })
            }
          ]
        }
      ]}
    >
      <Ionicons name={icon} size={size} color={color} />
    </Animated.View>
  );
}

export default function AnimatedBackground() {
  const pulse = useRef(new Animated.Value(0)).current;
  const { isDarkMode, themeColors } = useThemeMode();

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 5200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 5200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true
        })
      ])
    ).start();
  }, [pulse]);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Animated.View
        style={[
          styles.glow,
          styles.glowPink,
          {
            backgroundColor: isDarkMode ? "rgba(122, 69, 102, 0.32)" : colors.accent,
            opacity: pulse.interpolate({
              inputRange: [0, 1],
              outputRange: [0.46, 0.74]
            }),
            transform: [
              {
                scale: pulse.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 1.14]
                })
              }
            ]
          }
        ]}
      />
      <Animated.View
        style={[
          styles.glow,
          styles.glowPurple,
          {
            backgroundColor: isDarkMode ? "rgba(76, 64, 94, 0.52)" : themeColors.lavender,
            opacity: pulse.interpolate({
              inputRange: [0, 1],
              outputRange: [0.28, 0.52]
            }),
            transform: [
              {
                scale: pulse.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1.08, 0.96]
                })
              }
            ]
          }
        ]}
      />
      <FloatingShape
        delay={0}
        duration={4200}
        icon="sparkles"
        size={24}
        color={isDarkMode ? "rgba(230, 76, 141, 0.14)" : "rgba(230, 76, 141, 0.22)"}
        style={styles.sparkleOne}
      />
      <FloatingShape
        delay={650}
        duration={5200}
        icon="heart"
        size={22}
        color={isDarkMode ? "rgba(124, 104, 216, 0.12)" : "rgba(124, 104, 216, 0.18)"}
        style={styles.sparkleTwo}
      />
      <FloatingShape
        delay={900}
        duration={4700}
        icon="leaf"
        size={26}
        color={isDarkMode ? "rgba(58, 176, 139, 0.12)" : "rgba(58, 176, 139, 0.18)"}
        style={styles.sparkleThree}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  glow: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 130
  },
  glowPink: {
    top: -68,
    left: -70
  },
  glowPurple: {
    right: -90,
    bottom: 80
  },
  shape: {
    position: "absolute"
  },
  sparkleOne: {
    top: 96,
    right: 36
  },
  sparkleTwo: {
    top: 270,
    left: 28
  },
  sparkleThree: {
    bottom: 170,
    right: 42
  }
});
