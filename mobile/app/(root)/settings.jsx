import { useUser, useClerk } from "@clerk/clerk-expo";
import { Alert, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { styles as createStyles } from "../../assets/styles/create.styles";
import { styles } from "../../assets/styles/settings.styles";
import { COLORS } from "../../constants/colors";
import { useAppSettings } from "../../context/AppSettingsContext";

const CURRENCIES = ["USD", "PKR", "EUR"];

export default function SettingsScreen() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const { preferredCurrency, setPreferredCurrency, displayName, setDisplayName } = useAppSettings();
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
      { text: "Logout", style: "destructive", onPress: () => signOut() },
    ]);
  };

  return (
    <View style={createStyles.container}>
      <View style={createStyles.card}>
        <Text style={createStyles.sectionTitle}>Settings</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Display Name</Text>
          <View style={createStyles.inputContainer}>
            <Ionicons name="person-outline" size={22} color={COLORS.textLight} style={createStyles.inputIcon} />
            <TextInput
              style={createStyles.input}
              value={nameInput}
              onChangeText={setNameInput}
              placeholder={user?.firstName || "First name"}
              placeholderTextColor={COLORS.textLight}
            />
          </View>
          <TouchableOpacity style={styles.saveButton} onPress={onSaveDisplayName}>
            <Text style={styles.saveButtonText}>Save First Name</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferred Currency</Text>
          <View style={styles.chipsRow}>
            {CURRENCIES.map((code) => (
              <TouchableOpacity
                key={code}
                style={[styles.chip, preferredCurrency === code && styles.chipActive]}
                onPress={() => setPreferredCurrency(code)}
              >
                <Text style={[styles.chipText, preferredCurrency === code && styles.chipTextActive]}>
                  {code}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity style={[styles.saveButton, { backgroundColor: COLORS.expense }]} onPress={onLogout}>
          <Text style={styles.saveButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
