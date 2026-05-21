import { Alert, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { styles } from "../../assets/styles/create.styles";
import { styles as settingsStyles } from "../../assets/styles/settings.styles";
import { COLORS } from "../../constants/colors";
import { useAppSettings } from "../../context/AppSettingsContext";

export default function CategoriesScreen() {
  const { categories, addCategory, deleteCategory } = useAppSettings();
  const [name, setName] = useState("");

  const onAdd = () => {
    const result = addCategory(name);
    if (!result.ok) return Alert.alert("Error", result.message);
    setName("");
  };

  const onDelete = (id, categoryName) => {
    Alert.alert("Delete Category", `Delete ${categoryName}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          const result = deleteCategory(id);
          if (!result.ok) Alert.alert("Error", result.message);
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Categories</Text>

        <View style={styles.inputContainer}>
          <Ionicons name="pricetag-outline" size={22} color={COLORS.textLight} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="New category"
            placeholderTextColor={COLORS.textLight}
          />
          <TouchableOpacity style={styles.urlScanButton} onPress={onAdd}>
            <Text style={styles.urlScanButtonText}>Add</Text>
          </TouchableOpacity>
        </View>

        <View style={settingsStyles.listContainer}>
          {categories.map((category) => (
            <View key={category.id} style={settingsStyles.rowItem}>
              <View style={settingsStyles.rowLeft}>
                <Ionicons name={category.icon || "pricetag-outline"} size={18} color={COLORS.primary} />
                <Text style={settingsStyles.rowText}>{category.name}</Text>
              </View>
              <TouchableOpacity onPress={() => onDelete(category.id, category.name)}>
                <Ionicons name="trash-outline" size={18} color={COLORS.expense} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}
