import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

import AnimatedBackground from "../components/AnimatedBackground";
import AppButton from "../components/AppButton";
import Card from "../components/Card";
import FadeInView from "../components/FadeInView";
import { saveOnboardingData } from "../storage/storage";
import { colors, spacing, type } from "../styles/theme";
import { useThemeMode } from "../context/ThemeContext";
import { formatFriendly, fromDateId, toDateId } from "../utils/date";
import { schedulePeriodReminder } from "../utils/notifications";
import { getNextPeriodDate } from "../utils/cycle";

const steps = [
  {
    title: "A little about you",
    subtitle: "This helps HerCycle make more useful predictions."
  },
  {
    title: "Your cycle pattern",
    subtitle: "Irregular cycles are common with PCOD and PCOS."
  },
  {
    title: "Last period",
    subtitle: "Pick the first day of your most recent period."
  }
];

function ChoiceButton({ label, selected, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.choice, selected ? styles.choiceSelected : null]}
    >
      <Text style={[styles.choiceText, selected ? styles.choiceTextSelected : null]}>
        {label}
      </Text>
    </Pressable>
  );
}

export default function OnboardingScreen({ onComplete }) {
  const { themeColors } = useThemeMode();
  const [step, setStep] = useState(0);
  const [nickname, setNickname] = useState("");
  const [age, setAge] = useState("");
  const [regular, setRegular] = useState("Yes");
  const [condition, setCondition] = useState("None");
  const [cycleType, setCycleType] = useState("Regular");
  const [lastPeriodDate, setLastPeriodDate] = useState(toDateId());
  const [showPicker, setShowPicker] = useState(false);
  const keyboardLift = useRef(new Animated.Value(0)).current;

  const canContinue = step !== 0 || Number(age) > 0;

  useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSub = Keyboard.addListener(showEvent, () => {
      Animated.timing(keyboardLift, {
        toValue: 1,
        duration: 240,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true
      }).start();
    });

    const hideSub = Keyboard.addListener(hideEvent, () => {
      Animated.timing(keyboardLift, {
        toValue: 0,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true
      }).start();
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [keyboardLift]);

  async function finishOnboarding() {
    const data = {
      age: Number(age),
      nickname: nickname.trim(),
      regular,
      condition,
      cycleType,
      lastPeriodDate,
      createdAt: toDateId()
    };

    await saveOnboardingData(data);
    onComplete();
    schedulePeriodReminder(getNextPeriodDate(data, [])).catch(() => {});
  }

  function nextStep() {
    if (step < steps.length - 1) {
      setStep(step + 1);
      return;
    }

    finishOnboarding();
  }

  return (
    <SafeAreaView
      edges={["top", "bottom", "left", "right"]}
      style={[styles.safeArea, { backgroundColor: themeColors.background }]}
    >
      <AnimatedBackground />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
        style={styles.container}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.centerColumn}>
            <Animated.View
              style={[
                styles.headerLift,
                {
                  opacity: keyboardLift.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 0.96]
                  }),
                  transform: [
                  {
                    translateY: keyboardLift.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -8]
                    })
                  }
                  ]
                }
              ]}
            >
              <FadeInView style={styles.header}>
                <Animated.View
                  style={[
                    styles.logo,
                    {
                      opacity: keyboardLift.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 0]
                      }),
                      transform: [
                        {
                          scale: keyboardLift.interpolate({
                            inputRange: [0, 1],
                            outputRange: [1, 0.7]
                          })
                        }
                      ]
                    }
                  ]}
                >
                <Ionicons name="heart" size={24} color={colors.surface} />
                </Animated.View>
                <Text style={[styles.appName, { color: themeColors.text }]}>HerCycle</Text>
                <View style={styles.stepBar}>
                  {steps.map((item, index) => (
                    <View
                      key={item.title}
                      style={[
                        styles.stepDot,
                        index <= step ? styles.stepDotActive : null
                      ]}
                    />
                  ))}
                </View>
                <Text style={styles.progress}>Step {step + 1} of {steps.length}</Text>
              </FadeInView>
            </Animated.View>

            <Animated.View
              style={{
                transform: [
                  {
                    translateY: keyboardLift.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 0]
                    })
                  }
                ]
              }}
            >
              <Card style={styles.card} delay={120}>
              <Text style={[styles.title, { color: themeColors.text }]}>{steps[step].title}</Text>
              <Text style={[styles.subtitle, { color: themeColors.textSoft }]}>{steps[step].subtitle}</Text>

              {step === 0 ? (
                <View style={styles.fieldGroup}>
                <Text style={styles.label}>Choose nickname</Text>
                <TextInput
                  value={nickname}
                  onChangeText={setNickname}
                  placeholder="Example: Shubha"
                  placeholderTextColor={colors.muted}
                  style={styles.input}
                  maxLength={24}
                />

                <Text style={styles.label}>Age</Text>
                <TextInput
                    value={age}
                    onChangeText={setAge}
                    keyboardType="number-pad"
                    placeholder="Enter your age"
                    placeholderTextColor={colors.muted}
                    style={styles.input}
                    maxLength={3}
                  />

                  <Text style={styles.label}>Are your periods regular?</Text>
                  <View style={styles.row}>
                    {["Yes", "No"].map((item) => (
                      <ChoiceButton
                        key={item}
                        label={item}
                        selected={regular === item}
                        onPress={() => setRegular(item)}
                      />
                    ))}
                  </View>
                </View>
              ) : null}

              {step === 1 ? (
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Do you have PCOD or PCOS?</Text>
                  <View style={styles.wrap}>
                    {["PCOD", "PCOS", "None", "Not Sure"].map((item) => (
                      <ChoiceButton
                        key={item}
                        label={item}
                        selected={condition === item}
                        onPress={() => setCondition(item)}
                      />
                    ))}
                  </View>

                  <Text style={styles.label}>Cycle type</Text>
                  <View style={styles.row}>
                    {["Regular", "Irregular"].map((item) => (
                      <ChoiceButton
                        key={item}
                        label={item}
                        selected={cycleType === item}
                        onPress={() => setCycleType(item)}
                      />
                    ))}
                  </View>
                </View>
              ) : null}

              {step === 2 ? (
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Last period date</Text>
                  <Pressable
                    onPress={() => setShowPicker(true)}
                    style={({ pressed }) => [
                      styles.dateButton,
                      pressed ? styles.dateButtonPressed : null
                    ]}
                  >
                    <Ionicons name="calendar" size={20} color={colors.primary} />
                    <Text style={styles.dateText}>{formatFriendly(lastPeriodDate)}</Text>
                  </Pressable>

                  {showPicker ? (
                    <DateTimePicker
                      value={fromDateId(lastPeriodDate)}
                      mode="date"
                      maximumDate={new Date()}
                      display={Platform.OS === "ios" ? "spinner" : "default"}
                      onChange={(event, selectedDate) => {
                        if (Platform.OS !== "ios") {
                          setShowPicker(false);
                        }

                        if (selectedDate) {
                          setLastPeriodDate(toDateId(selectedDate));
                        }
                      }}
                    />
                  ) : null}
                </View>
              ) : null}
              </Card>

              <FadeInView style={styles.footer} delay={220}>
                {step > 0 ? (
                  <AppButton
                    title="Back"
                    variant="soft"
                    icon="chevron-back"
                    onPress={() => setStep(step - 1)}
                  />
                ) : null}
                <AppButton
                  title={step === steps.length - 1 ? "Finish" : "Continue"}
                  icon={step === steps.length - 1 ? "checkmark" : "chevron-forward"}
                  onPress={nextStep}
                  disabled={!canContinue}
                />
              </FadeInView>
            </Animated.View>
          </View>
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
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: 120,
    justifyContent: "center",
    alignItems: "center"
  },
  centerColumn: {
    width: "100%",
    maxWidth: 430,
    alignSelf: "center",
    justifyContent: "center",
    gap: spacing.lg
  },
  header: {
    alignItems: "center",
    paddingTop: spacing.sm
  },
  headerLift: {
    width: "100%"
  },
  logo: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    marginBottom: spacing.sm,
    shadowColor: colors.primaryDark,
    shadowOpacity: 0.28,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 7
  },
  appName: {
    fontSize: 30,
    fontWeight: "900",
    color: colors.text
  },
  progress: {
    marginTop: 6,
    color: colors.textSoft,
    fontWeight: "700"
  },
  stepBar: {
    flexDirection: "row",
    gap: 7,
    marginTop: spacing.md
  },
  stepDot: {
    width: 28,
    height: 6,
    borderRadius: 99,
    backgroundColor: colors.border
  },
  stepDotActive: {
    width: 42,
    backgroundColor: colors.primary
  },
  card: {
    width: "100%",
    gap: spacing.md
  },
  title: {
    color: colors.text,
    fontSize: type.title,
    fontWeight: "900"
  },
  subtitle: {
    color: colors.textSoft,
    fontSize: type.body,
    lineHeight: 23
  },
  fieldGroup: {
    gap: spacing.md,
    marginTop: spacing.sm
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
  },
  row: {
    flexDirection: "row",
    gap: spacing.sm,
    width: "100%"
  },
  wrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  choice: {
    flex: 1,
    minHeight: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface
  },
  choiceSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  choiceText: {
    color: colors.textSoft,
    fontWeight: "800"
  },
  choiceTextSelected: {
    color: colors.surface
  },
  dateButton: {
    minHeight: 56,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSoft
  },
  dateButtonPressed: {
    transform: [{ scale: 0.99 }],
    borderColor: colors.primary
  },
  dateText: {
    color: colors.text,
    fontSize: type.body,
    fontWeight: "800"
  },
  footer: {
    width: "100%",
    gap: spacing.sm,
    marginTop: spacing.xs
  }
});
