import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light";
type TextSize = "sm" | "md" | "lg";

interface SettingsContextType {
  theme: Theme;
  setTheme: (t: Theme) => void;
  colorblindMode: boolean;
  setColorblindMode: (v: boolean) => void;
  textSize: TextSize;
  setTextSize: (s: TextSize) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const useSettings = () => {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
};

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() =>
    (localStorage.getItem("app-theme") as Theme) || "dark"
  );
  const [colorblindMode, setColorblindState] = useState<boolean>(() =>
    localStorage.getItem("app-colorblind") === "true"
  );
  const [textSize, setTextSizeState] = useState<TextSize>(() =>
    (localStorage.getItem("app-text-size") as TextSize) || "md"
  );

  const setTheme = (t: Theme) => {
    setThemeState(t);
    localStorage.setItem("app-theme", t);
  };
  const setColorblindMode = (v: boolean) => {
    setColorblindState(v);
    localStorage.setItem("app-colorblind", String(v));
  };
  const setTextSize = (s: TextSize) => {
    setTextSizeState(s);
    localStorage.setItem("app-text-size", s);
  };

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "light") {
      root.classList.add("light");
      root.classList.remove("dark");
    } else {
      root.classList.add("dark");
      root.classList.remove("light");
    }
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;
    if (colorblindMode) {
      root.classList.add("colorblind");
    } else {
      root.classList.remove("colorblind");
    }
  }, [colorblindMode]);

  useEffect(() => {
    document.documentElement.setAttribute("data-text-size", textSize);
  }, [textSize]);

  return (
    <SettingsContext.Provider value={{ theme, setTheme, colorblindMode, setColorblindMode, textSize, setTextSize }}>
      {children}
    </SettingsContext.Provider>
  );
};
