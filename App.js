import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Image,
  Platform,
  StyleSheet,
  Text,
  View
} from "react-native";
import { DarkTheme, DefaultTheme, NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import * as Notifications from "expo-notifications";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";

import HomeScreen from "./src/screens/HomeScreen";
import LoginScreen from "./src/screens/LoginScreen";
import OnboardingScreen from "./src/screens/OnboardingScreen";
import WeightScreen from "./src/screens/WeightScreen";
import InfoScreen from "./src/screens/InfoScreen";
import TrackingScreen from "./src/screens/TrackingScreen";
import MedicalScreen from "./src/screens/MedicalScreen";
import ReportScreen from "./src/screens/ReportScreen";
import {
  clearLocalData,
  getSettings,
  getOnboardingData,
  hydrateLocalDataFromCloud
} from "./src/storage/storage";
import { listenToAuthState } from "./src/services/authService";
import {
  loadUserDataFromCloud,
  saveUserDataPatch
} from "./src/services/userDataService";
import { colors } from "./src/styles/theme";
import AnimatedBackground from "./src/components/AnimatedBackground";
import { ThemeProvider, useThemeMode } from "./src/context/ThemeContext";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false
  })
});

const Tab = createBottomTabNavigator();
const appIcon = require("./icon.png");

function MainTabs() {
  const insets = useSafeAreaInsets();
  const { isDarkMode, themeColors } = useThemeMode();
  const bottomPadding = Math.max(insets.bottom, Platform.OS === "android" ? 12 : 10);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        sceneContainerStyle: {
          backgroundColor: themeColors.background
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: themeColors.muted,
        tabBarStyle: [
          styles.tabBar,
          {
            backgroundColor: "transparent",
            borderColor: "transparent",
            shadowColor: themeColors.shadow,
            height: 72 + bottomPadding,
            paddingBottom: bottomPadding
          }
        ],
        tabBarBackground: () => (
          <View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: isDarkMode ? themeColors.background : themeColors.surface }
            ]}
          >
            <View
              style={[
                styles.tabBarInner,
                {
                  backgroundColor: themeColors.surfaceGlass,
                  borderColor: themeColors.border
                }
              ]}
            />
          </View>
        ),
        tabBarLabelStyle: styles.tabLabel,
        tabBarIcon: ({ color, size }) => {
          const icons = {
            Home: "calendar",
            Track: "heart",
            Weight: "barbell",
            Medical: "medkit",
            Report: "document-text",
            Learn: "medical"
          };
          return <Ionicons name={icons[route.name]} size={size} color={color} />;
        }
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Track" component={TrackingScreen} />
      <Tab.Screen name="Weight" component={WeightScreen} />
      <Tab.Screen name="Medical" component={MedicalScreen} />
      <Tab.Screen name="Report" component={ReportScreen} />
      <Tab.Screen name="Learn" component={InfoScreen} />
    </Tab.Navigator>
  );
}

function ThemedStatusBar() {
  const { isDarkMode, themeColors } = useThemeMode();

  return (
    <StatusBar
      style={isDarkMode ? "light" : "dark"}
      backgroundColor={themeColors.background}
      translucent={false}
    />
  );
}

function StartupIntro() {
  const logoScale = useRef(new Animated.Value(0.86)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textTranslate = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 6,
        tension: 85,
        useNativeDriver: true
      }),
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 700,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true
      }),
      Animated.sequence([
        Animated.delay(350),
        Animated.parallel([
          Animated.timing(textOpacity, {
            toValue: 1,
            duration: 500,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true
          }),
          Animated.timing(textTranslate, {
            toValue: 0,
            duration: 500,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true
          })
        ])
      ])
    ]).start();
  }, [logoOpacity, logoScale, textOpacity, textTranslate]);

  return (
    <View style={styles.introScreen}>
      <AnimatedBackground />
      <Animated.View
        style={[
          styles.introLogoWrap,
          {
            opacity: logoOpacity,
            transform: [{ scale: logoScale }]
          }
        ]}
      >
        <Image source={appIcon} style={styles.introLogo} resizeMode="contain" />
      </Animated.View>
      <Animated.Text
        style={[
          styles.introCredit,
          {
            opacity: textOpacity,
            transform: [{ translateY: textTranslate }]
          }
        ]}
      >
        Made by Shubham Kuthe
      </Animated.Text>
    </View>
  );
}

function AppShell({ isLoading, isIntroDone, user, hasOnboarded, setHasOnboarded }) {
  const { isDarkMode, themeColors } = useThemeMode();
  const navigationTheme = useMemo(
    () => ({
    ...(isDarkMode ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDarkMode ? DarkTheme.colors : DefaultTheme.colors),
      background: themeColors.background,
      card: themeColors.background,
      border: themeColors.border,
      text: themeColors.text,
      primary: colors.primary,
      notification: colors.primary
    }
  }),
    [isDarkMode, themeColors]
  );

  if (!isIntroDone) {
    return <StartupIntro />;
  }

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <AnimatedBackground />
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer theme={navigationTheme}>
      <ThemedStatusBar />
      {!user ? (
        <LoginScreen />
      ) : hasOnboarded ? (
        <MainTabs />
      ) : (
        <OnboardingScreen onComplete={() => setHasOnboarded(true)} />
      )}
    </NavigationContainer>
  );
}

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isIntroDone, setIsIntroDone] = useState(false);
  const [hasOnboarded, setHasOnboarded] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsIntroDone(true), 2200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const unsubscribe = listenToAuthState(async (firebaseUser) => {
      setIsLoading(true);
      setUser(firebaseUser);

      if (firebaseUser) {
        const cloudData = await loadUserDataFromCloud();
        await hydrateLocalDataFromCloud(cloudData);
        try {
          await saveUserDataPatch({ settings: await getSettings() });
        } catch (error) {
          console.warn("Initial Firestore sync failed", error);
        }
        const onboarding = await getOnboardingData();
        setHasOnboarded(Boolean(onboarding));
      } else {
        await clearLocalData();
        setHasOnboarded(false);
      }

      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppShell
          isLoading={isLoading}
          isIntroDone={isIntroDone}
          user={user}
          hasOnboarded={hasOnboarded}
          setHasOnboarded={setHasOnboarded}
        />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background
  },
  introScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
    paddingHorizontal: 24
  },
  introLogoWrap: {
    width: 156,
    height: 156,
    borderRadius: 34,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.78)",
    shadowColor: colors.shadow,
    shadowOpacity: 0.16,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8
  },
  introLogo: {
    width: 124,
    height: 124,
    borderRadius: 28
  },
  introCredit: {
    marginTop: 18,
    fontSize: 18,
    fontWeight: "800",
    color: colors.primaryDark,
    letterSpacing: 0
  },
  tabBar: {
    marginHorizontal: 0,
    marginBottom: 0,
    paddingTop: 8,
    borderWidth: 0,
    backgroundColor: "transparent",
    elevation: 12,
    shadowColor: colors.shadow,
    shadowOpacity: 0.16,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 }
  },
  tabBarInner: {
    ...StyleSheet.absoluteFillObject,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1
  },
  tabLabel: {
    fontWeight: "800",
    fontSize: 10
  }
});
