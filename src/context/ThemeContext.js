import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getSettings, updateSettings } from "../storage/storage";
import { colors } from "../styles/theme";

const darkColors = {
  ...colors,
  background: "#14101A",
  surface: "#211A28",
  surfaceGlass: "#211A28",
  surfaceSoft: "#2C2334",
  text: "#FFF7FA",
  textSoft: "#D8C9D8",
  muted: "#A99AAD",
  border: "#3A2D43",
  lavender: "#35284C",
  mint: "#203B36",
  shadow: "#000000"
};

const ThemeContext = createContext({
  isDarkMode: false,
  themeColors: colors,
  toggleDarkMode: async () => {}
});

export function ThemeProvider({ children }) {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    getSettings().then((settings) => {
      setIsDarkMode(Boolean(settings.darkMode));
    });
  }, []);

  const value = useMemo(
    () => ({
      isDarkMode,
      themeColors: isDarkMode ? darkColors : colors,
      toggleDarkMode: async () => {
        const next = !isDarkMode;
        setIsDarkMode(next);
        await updateSettings({ darkMode: next });
      }
    }),
    [isDarkMode]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemeMode() {
  return useContext(ThemeContext);
}
