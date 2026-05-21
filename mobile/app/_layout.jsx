import { Slot } from "expo-router";
import SafeScreen from "@/components/SafeScreen";
import { ClerkProvider } from "@clerk/clerk-expo";
import { tokenCache } from "@clerk/clerk-expo/token-cache";
import { StatusBar } from "expo-status-bar";
import { AppSettingsProvider } from "../context/AppSettingsContext";
import { useEffect, useState } from "react";
import LaunchSplash from "../components/LaunchSplash";

export default function RootLayout() {
  const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2400);
    return () => clearTimeout(timer);
  }, []);

  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <AppSettingsProvider>
        <SafeScreen>
          {showSplash ? <LaunchSplash /> : <Slot />}
        </SafeScreen>
        <StatusBar style={showSplash ? "light" : "dark"} />
      </AppSettingsProvider>
    </ClerkProvider>
  );
}
