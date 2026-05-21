import {
  View,
  Text,
  Alert,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useUser } from "@clerk/clerk-expo";
import { useState } from "react";
import { API_URL } from "../../constants/api";
import { styles } from "../../assets/styles/create.styles";
import { COLORS } from "../../constants/colors";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { DEFAULT_CURRENCY } from "../../lib/currency";
import { useAppSettings } from "../../context/AppSettingsContext";

const CreateScreen = () => {
  const router = useRouter();
  const { user } = useUser();
  const { categories } = useAppSettings();

  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [isExpense, setIsExpense] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [receiptUrl, setReceiptUrl] = useState("");
  const [receiptId, setReceiptId] = useState(null);
  const [receiptDate, setReceiptDate] = useState(null);
  const [ocrConfidence, setOcrConfidence] = useState(null);

  const applyOcrResult = (result) => {
    if (result?.extractedMerchant) setTitle(result.extractedMerchant);
    if (result?.extractedAmount) setAmount(String(Math.abs(result.extractedAmount)));
    if (result?.extractedDate) setReceiptDate(result.extractedDate);

    setIsExpense(true);
    setSelectedCategory("Food & Drinks");
    setReceiptId(result?.id || null);
    setOcrConfidence(result?.confidence || null);
  };

  const scanReceipt = async ({ imageBase64, imageUrl }) => {
    if (!imageBase64 && !imageUrl) {
      Alert.alert("Error", "Please provide an image to scan.");
      return;
    }

    setIsScanning(true);
    try {
      const response = await fetch(`${API_URL}/ocr/scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64, imageUrl }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data?.message || "Scan failed, retry.");

      applyOcrResult(data);

      if (!data.extractedAmount || !data.extractedDate) {
        Alert.alert("Review required", "Amount/date missing. Please review fields before save.");
      }
    } catch (error) {
      Alert.alert("Scan failed", error.message || "Scan failed, retry.");
    } finally {
      setIsScanning(false);
    }
  };

  const handleScanFromGallery = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission required", "Gallery permission is needed for receipt scanning.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: false,
    });

    if (result.canceled) return;
    const uri = result.assets?.[0]?.uri;
    if (!uri) return;

    const base64 = await FileSystem.readAsStringAsync(uri, { encoding: "base64" });
    await scanReceipt({ imageBase64: `data:image/jpeg;base64,${base64}` });
  };

  const handleScanFromCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission required", "Camera permission is needed for receipt scanning.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: false,
    });

    if (result.canceled) return;
    const uri = result.assets?.[0]?.uri;
    if (!uri) return;

    const base64 = await FileSystem.readAsStringAsync(uri, { encoding: "base64" });
    await scanReceipt({ imageBase64: `data:image/jpeg;base64,${base64}` });
  };

  const handleScanFromUrl = async () => {
    if (!receiptUrl.trim()) {
      Alert.alert("Error", "Please enter a receipt image URL.");
      return;
    }
    await scanReceipt({ imageUrl: receiptUrl.trim() });
  };

  const handleCreate = async () => {
    // validations
    if (!title.trim()) return Alert.alert("Error", "Please enter a transaction title");
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      Alert.alert("Error", "Please enter a valid amount");
      return;
    }

    if (!selectedCategory) return Alert.alert("Error", "Please select a category");

    setIsLoading(true);
    try {
      // Format the amount (negative for expenses, positive for income)
      const formattedAmount = isExpense
        ? -Math.abs(parseFloat(amount))
        : Math.abs(parseFloat(amount));

      const response = await fetch(`${API_URL}/transactions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: user.id,
          title,
          amount: formattedAmount,
          category: selectedCategory,
          currency: DEFAULT_CURRENCY,
          paymentMethod: "Card",
          tags: ["receipt"],
          date: receiptDate || new Date().toISOString().slice(0, 10),
          receiptId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.log(errorData);
        throw new Error(errorData.error || "Failed to create transaction");
      }

      const transaction = await response.json();
      if (receiptId && transaction?.id) {
        await fetch(`${API_URL}/receipts/${receiptId}/link`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ transactionId: transaction.id }),
        });
      }

      Alert.alert("Success", "Transaction created successfully");
      router.back();
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to create transaction");
      console.error("Error creating transaction:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Transaction</Text>
        <TouchableOpacity
          style={[styles.saveButtonContainer, isLoading && styles.saveButtonDisabled]}
          onPress={handleCreate}
          disabled={isLoading}
        >
          <Text style={styles.saveButton}>{isLoading ? "Saving..." : "Save"}</Text>
          {!isLoading && <Ionicons name="checkmark" size={18} color={COLORS.primary} />}
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>
          <Ionicons name="scan-outline" size={16} color={COLORS.text} /> Scan Receipt
        </Text>

        <View style={styles.scanActions}>
          <TouchableOpacity style={styles.scanButton} onPress={handleScanFromCamera} disabled={isScanning}>
            <Ionicons name="camera-outline" size={18} color={COLORS.primary} />
            <Text style={styles.scanButtonText}>Camera</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.scanButton} onPress={handleScanFromGallery} disabled={isScanning}>
            <Ionicons name="images-outline" size={18} color={COLORS.primary} />
            <Text style={styles.scanButtonText}>Gallery</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.inputContainer}>
          <Ionicons name="link-outline" size={22} color={COLORS.textLight} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Optional receipt image URL"
            placeholderTextColor={COLORS.textLight}
            value={receiptUrl}
            onChangeText={setReceiptUrl}
            autoCapitalize="none"
          />
          <TouchableOpacity style={styles.urlScanButton} onPress={handleScanFromUrl} disabled={isScanning}>
            <Text style={styles.urlScanButtonText}>Scan</Text>
          </TouchableOpacity>
        </View>

        {isScanning && (
          <View style={styles.inlineLoadingRow}>
            <ActivityIndicator size="small" color={COLORS.primary} />
            <Text style={styles.inlineLoadingText}>Scanning receipt...</Text>
          </View>
        )}

        {receiptId && (
          <View style={styles.ocrNotice}>
            <Ionicons name="checkmark-circle-outline" size={18} color={COLORS.income} />
            <Text style={styles.ocrNoticeText}>
              OCR pre-filled fields. Please review before saving.
            </Text>
          </View>
        )}

        {ocrConfidence !== null && ocrConfidence < 0.7 && (
          <View style={styles.ocrWarning}>
            <Ionicons name="alert-circle-outline" size={18} color={COLORS.expense} />
            <Text style={styles.ocrWarningText}>Low confidence scan, review values carefully.</Text>
          </View>
        )}

        <View style={styles.typeSelector}>
          {/* EXPENSE SELECTOR */}
          <TouchableOpacity
            style={[styles.typeButton, isExpense && styles.typeButtonActive]}
            onPress={() => setIsExpense(true)}
          >
            <Ionicons
              name="arrow-down-circle"
              size={22}
              color={isExpense ? COLORS.white : COLORS.expense}
              style={styles.typeIcon}
            />
            <Text style={[styles.typeButtonText, isExpense && styles.typeButtonTextActive]}>
              Expense
            </Text>
          </TouchableOpacity>

          {/* INCOME SELECTOR */}
          <TouchableOpacity
            style={[styles.typeButton, !isExpense && styles.typeButtonActive]}
            onPress={() => setIsExpense(false)}
          >
            <Ionicons
              name="arrow-up-circle"
              size={22}
              color={!isExpense ? COLORS.white : COLORS.income}
              style={styles.typeIcon}
            />
            <Text style={[styles.typeButtonText, !isExpense && styles.typeButtonTextActive]}>
              Income
            </Text>
          </TouchableOpacity>
        </View>

        {/* AMOUNT CONTAINER */}
        <View style={styles.amountContainer}>
          <Text style={styles.currencySymbol}>$</Text>
          <TextInput
            style={styles.amountInput}
            placeholder="0.00"
            placeholderTextColor={COLORS.textLight}
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
          />
        </View>

        {/* INPUT CONTAINER */}
        <View style={styles.inputContainer}>
          <Ionicons
            name="create-outline"
            size={22}
            color={COLORS.textLight}
            style={styles.inputIcon}
          />
          <TextInput
            style={styles.input}
            placeholder="Transaction Title"
            placeholderTextColor={COLORS.textLight}
            value={title}
            onChangeText={setTitle}
          />
        </View>

        {/* TITLE */}
        <Text style={styles.sectionTitle}>
          <Ionicons name="pricetag-outline" size={16} color={COLORS.text} /> Category
        </Text>

        <View style={styles.categoryGrid}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryButton,
                selectedCategory === category.name && styles.categoryButtonActive,
              ]}
              onPress={() => setSelectedCategory(category.name)}
            >
              <Ionicons
                name={category.icon}
                size={20}
                color={selectedCategory === category.name ? COLORS.white : COLORS.text}
                style={styles.categoryIcon}
              />
              <Text
                style={[
                  styles.categoryButtonText,
                  selectedCategory === category.name && styles.categoryButtonTextActive,
                ]}
              >
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      )}
    </View>
  );
};
export default CreateScreen;
