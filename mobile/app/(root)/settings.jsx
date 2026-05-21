import { useUser, useClerk } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { Alert, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { styles } from "../../assets/styles/settings.styles";
import { useAppSettings } from "../../context/AppSettingsContext";

const CURRENCIES = ["USD", "PKR", "EUR"];
const THEMES = [
  { key: "dark", label: "Dark" },
  { key: "light", label: "Light" },
];

export default function SettingsScreen() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
  const {
    preferredCurrency,
    setPreferredCurrency,
    displayName,
    setDisplayName,
    themeMode,
    setThemeMode,
    themeColors,
  } = useAppSettings();
  const [nameInput, setNameInput] = useState(user?.firstName || displayName || "");

  const onSaveDisplayName = async () => {
    const value = nameInput.trim();
    if (!value) {
      Alert.alert("Error", "First name cannot be empty");
      return;
    }

    try {
      await user?.update({ firstName: value });
      setDisplayName(value);
      Alert.alert("Saved", "First name updated");
    } catch (error) {
      console.log("Failed to update first name", error);
      Alert.alert("Error", "Failed to update first name");
    }
  };

  const onLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          try {
            await signOut();
            router.replace("/sign-in");
          } catch (error) {
            console.log("Logout failed", error);
            Alert.alert("Error", "Failed to logout. Please try again.");
          }
        },
      },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <View style={[styles.card, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
        <Text style={[styles.screenTitle, { color: themeColors.text }]}>Settings</Text>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: themeColors.textLight }]}>Display Name</Text>
          <View style={[styles.inputContainer, { borderColor: themeColors.border, backgroundColor: themeColors.surface }]}>
            <Ionicons name="person-outline" size={22} color={themeColors.textLight} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: themeColors.text }]}
              value={nameInput}
              onChangeText={setNameInput}
              placeholder={user?.firstName || "First name"}
              placeholderTextColor={themeColors.textLight}
            />
          </View>
          <TouchableOpacity style={[styles.saveButton, { backgroundColor: themeColors.primary }]} onPress={onSaveDisplayName}>
            <Text style={[styles.saveButtonText, { color: themeColors.white }]}>Save First Name</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: themeColors.textLight }]}>Theme</Text>
          <View style={styles.chipsRow}>
            {THEMES.map((item) => (
              <TouchableOpacity
                key={item.key}
                style={[
                  styles.chip,
                  { borderColor: themeColors.border, backgroundColor: themeColors.surface },
                  themeMode === item.key && { backgroundColor: themeColors.primary, borderColor: themeColors.primary },
                ]}
                onPress={() => setThemeMode(item.key)}
              >
                <Text
                  style={[
                    styles.chipText,
                    { color: themeColors.text },
                    themeMode === item.key && { color: themeColors.white },
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: themeColors.textLight }]}>Preferred Currency</Text>
          <View style={styles.chipsRow}>
            {CURRENCIES.map((code) => (
              <TouchableOpacity
                key={code}
                style={[
                  styles.chip,
                  { borderColor: themeColors.border, backgroundColor: themeColors.surface },
                  preferredCurrency === code && { backgroundColor: themeColors.primary, borderColor: themeColors.primary },
                ]}
                onPress={() => setPreferredCurrency(code)}
              >
                <Text
                  style={[
                    styles.chipText,
                    { color: themeColors.text },
                    preferredCurrency === code && { color: themeColors.white },
                  ]}
                >
                  {code}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity style={[styles.saveButton, { backgroundColor: themeColors.expense }]} onPress={onLogout}>
          <Text style={[styles.saveButtonText, { color: themeColors.white }]}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
