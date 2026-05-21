import { createContext, useContext, useEffect, useMemo, useState } from "react";
import * as SecureStore from "expo-secure-store";
import { getThemeColors } from "../constants/themes";

const SETTINGS_KEY = "wallet_app_settings_v1";

const DEFAULT_CATEGORIES = [
  { id: "food", name: "Food & Drinks", icon: "fast-food" },
  { id: "shopping", name: "Shopping", icon: "cart" },
  { id: "transportation", name: "Transportation", icon: "car" },
  { id: "entertainment", name: "Entertainment", icon: "film" },
  { id: "bills", name: "Bills", icon: "receipt" },
  { id: "income", name: "Income", icon: "cash" },
  { id: "other", name: "Other", icon: "ellipsis-horizontal" },
];

const AppSettingsContext = createContext(null);

export const AppSettingsProvider = ({ children }) => {
  const [preferredCurrency, setPreferredCurrency] = useState("USD");
  const [displayName, setDisplayName] = useState("");
  const [themeMode, setThemeMode] = useState("dark");
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await SecureStore.getItemAsync(SETTINGS_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed.preferredCurrency) setPreferredCurrency(parsed.preferredCurrency);
          if (typeof parsed.displayName === "string") setDisplayName(parsed.displayName);
          if (parsed.themeMode === "light" || parsed.themeMode === "dark") {
            setThemeMode(parsed.themeMode);
          }
          if (Array.isArray(parsed.categories) && parsed.categories.length) {
            setCategories(parsed.categories);
          }
        }
      } catch (error) {
        console.log("Failed to load settings", error);
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    const payload = JSON.stringify({ preferredCurrency, displayName, themeMode, categories });
    SecureStore.setItemAsync(SETTINGS_KEY, payload).catch((error) =>
      console.log("Failed to save settings", error)
    );
  }, [preferredCurrency, displayName, themeMode, categories, loaded]);

  const addCategory = (name) => {
    const trimmed = name.trim();
    if (!trimmed) return { ok: false, message: "Category name is required" };

    const exists = categories.some((c) => c.name.toLowerCase() === trimmed.toLowerCase());
    if (exists) return { ok: false, message: "Category already exists" };

    const next = [
      ...categories,
      { id: `custom_${Date.now()}`, name: trimmed, icon: "pricetag-outline", custom: true },
    ];

    setCategories(next);
    return { ok: true };
  };

  const deleteCategory = (id) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
    return { ok: true };
  };

  const themeColors = getThemeColors(themeMode);

  const value = useMemo(
    () => ({
      preferredCurrency,
      setPreferredCurrency,
      displayName,
      setDisplayName,
      themeMode,
      setThemeMode,
      themeColors,
      categories,
      addCategory,
      deleteCategory,
    }),
    [preferredCurrency, displayName, themeMode, themeColors, categories]
  );

  return <AppSettingsContext.Provider value={value}>{children}</AppSettingsContext.Provider>;
};

export const useAppSettings = () => {
  const ctx = useContext(AppSettingsContext);
  if (!ctx) throw new Error("useAppSettings must be used inside AppSettingsProvider");
  return ctx;
};
