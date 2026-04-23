import React, { useCallback, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

import AnimatedBackground from "../components/AnimatedBackground";
import AppButton from "../components/AppButton";
import Card from "../components/Card";
import FadeInView from "../components/FadeInView";
import { addWeightLog, getWeightLogs } from "../storage/storage";
import { colors, spacing, type } from "../styles/theme";
import { useThemeMode } from "../context/ThemeContext";
import { toDateId } from "../utils/date";

export default function WeightScreen() {
  const { themeColors } = useThemeMode();
  const [weight, setWeight] = useState("");
  const [logs, setLogs] = useState([]);

  const loadData = useCallback(async () => {
    setLogs(await getWeightLogs());
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  async function saveWeight() {
    const parsedWeight = Number(weight);

    if (!parsedWeight || parsedWeight <= 0) {
      Alert.alert("Check weight", "Enter a valid weight first.");
      return;
    }

    const nextLogs = await addWeightLog({
      date: toDateId(),
      weight: parsedWeight
    });
    setLogs(nextLogs);
    setWeight("");
  }

  const latest = logs[0];

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={[styles.safeArea, { backgroundColor: themeColors.background }]}
    >
      <AnimatedBackground />
      <ScrollView contentContainerStyle={styles.content}>
        <FadeInView>
          <Text style={styles.eyebrow}>Body notes</Text>
          <Text style={[styles.title, { color: themeColors.text }]}>Weight tracker</Text>
        </FadeInView>

        <Card style={styles.hero} delay={90}>
          <View style={styles.iconCircle}>
            <Ionicons name="barbell" size={26} color={colors.primary} />
          </View>
          <Text style={[styles.heroLabel, { color: themeColors.textSoft }]}>Latest weight</Text>
          <Text style={[styles.heroValue, { color: themeColors.text }]}>
            {latest ? `${latest.weight} kg` : "No log yet"}
          </Text>
        </Card>

        <Card delay={150}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Add weight</Text>
          <TextInput
            value={weight}
            onChangeText={setWeight}
            keyboardType="decimal-pad"
            placeholder="Example: 62.5"
            placeholderTextColor={colors.muted}
            style={styles.input}
          />
          <AppButton title="Save Weight" icon="save" onPress={saveWeight} />
        </Card>

        <Card delay={220}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>History</Text>
          {logs.length === 0 ? (
            <Text style={[styles.empty, { color: themeColors.textSoft }]}>Your weight history will appear here.</Text>
          ) : (
            logs.map((log) => (
              <View key={`${log.date}-${log.weight}`} style={styles.logRow}>
                <Text style={[styles.logDate, { color: themeColors.text }]}>{log.date}</Text>
                <Text style={styles.logWeight}>{log.weight} kg</Text>
              </View>
            ))
          )}
        </Card>
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
  hero: {
    alignItems: "center"
  },
  iconCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.lavender,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm
  },
  heroLabel: {
    color: colors.textSoft,
    fontWeight: "800"
  },
  heroValue: {
    color: colors.text,
    fontSize: 34,
    fontWeight: "900",
    marginTop: 4
  },
  sectionTitle: {
    color: colors.text,
    fontSize: type.subtitle,
    fontWeight: "900",
    marginBottom: spacing.sm
  },
  input: {
    minHeight: 54,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceGlass,
    paddingHorizontal: spacing.md,
    color: colors.text,
    fontSize: type.body,
    fontWeight: "700",
    marginBottom: spacing.md
  },
  empty: {
    color: colors.textSoft,
    fontWeight: "600"
  },
  logRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  logDate: {
    color: colors.text,
    fontWeight: "800"
  },
  logWeight: {
    color: colors.primary,
    fontWeight: "900"
  }
});
