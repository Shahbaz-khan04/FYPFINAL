import { useUser } from "@clerk/clerk-expo";
import { Redirect, Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../../constants/colors";
import { API_URL } from "../../constants/api";
import { useAppSettings } from "../../context/AppSettingsContext";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function Layout() {
  const { isSignedIn, isLoaded, user } = useUser();
  const { preferredCurrency } = useAppSettings();
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState(null);
  const riseAnim = useRef(new Animated.Value(12)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const d = new Date();
  const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

  if (!isLoaded) return null; // this is for a better ux

  if (!isSignedIn) return <Redirect href={"/sign-in"} />;

  const openAiModal = async () => {
    setShowAiModal(true);
    setAiLoading(true);
    setAiResponse(null);
    riseAnim.setValue(12);
    opacityAnim.setValue(0);
    Animated.parallel([
      Animated.timing(riseAnim, {
        toValue: 0,
        duration: 240,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 240,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    try {
      const response = await fetch(
        `${API_URL}/ai/monthly-insights/${user.id}?month=${encodeURIComponent(month)}&currency=${encodeURIComponent(preferredCurrency)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }
      );
      const data = await response.json();
      setAiResponse(data);
    } catch (error) {
      setAiResponse({ error: error.message || "Failed to fetch AI response" });
    } finally {
      setAiLoading(false);
    }
  };

  const closeAiModal = () => {
    setShowAiModal(false);
  };

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: COLORS.primary,
          tabBarInactiveTintColor: COLORS.textLight,
          tabBarStyle: {
            backgroundColor: COLORS.surfaceAlt,
            borderTopColor: COLORS.border,
            height: 64,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: "600",
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="transactions"
          options={{
            title: "Transactions",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="swap-horizontal-outline" color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="ai"
          options={{
            title: "",
            tabBarLabel: "",
            tabBarButton: () => (
              <TouchableOpacity style={styles.aiTabBtn} onPress={openAiModal} activeOpacity={0.85}>
                <View style={styles.aiTabGlow}>
                  <Ionicons name="sparkles" size={22} color={COLORS.background} />
                </View>
              </TouchableOpacity>
            ),
            tabBarIcon: () => null,
          }}
          listeners={{
            tabPress: (e) => e.preventDefault(),
          }}
        />
        <Tabs.Screen
          name="categories"
          options={{
            title: "Categories",
            tabBarIcon: ({ color, size }) => <Ionicons name="pricetags-outline" color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: "Settings",
            tabBarIcon: ({ color, size }) => <Ionicons name="settings-outline" color={color} size={size} />,
          }}
        />
        <Tabs.Screen name="create" options={{ href: null }} />
      </Tabs>

      <Modal visible={showAiModal} animationType="fade" transparent onRequestClose={closeAiModal}>
        <Pressable style={styles.modalBackdrop} onPress={closeAiModal}>
          <Animated.View
            style={[
              styles.modalCard,
              {
                opacity: opacityAnim,
                transform: [{ translateY: riseAnim }],
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>AI Insights of this Month</Text>
              <TouchableOpacity onPress={closeAiModal} style={styles.closeBtn}>
                <Ionicons name="close" size={18} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            {aiLoading ? (
              <View style={styles.loadingWrap}>
                <ActivityIndicator size="small" color={COLORS.primary} />
                <Text style={styles.loadingText}>Loading...</Text>
              </View>
            ) : (
              <ScrollView style={styles.jsonBox} showsVerticalScrollIndicator={false}>
                {aiResponse?.error || aiResponse?.message ? (
                  <Text style={styles.jsonText}>{aiResponse?.error || aiResponse?.message}</Text>
                ) : (
                  <>
                    <Text style={styles.aiSummary}>
                      {aiResponse?.insights?.oneLineSummary || "No summary available"}
                    </Text>

                    {(aiResponse?.insights?.highlights || []).map((h, i) => (
                      <Text key={`h_${i}`} style={styles.aiBullet}>
                        • {h}
                      </Text>
                    ))}

                    {(aiResponse?.insights?.tips || []).map((t, i) => (
                      <Text key={`t_${i}`} style={styles.aiTip}>
                        Tip: {t}
                      </Text>
                    ))}

                    <Text style={styles.aiRisk}>
                      Risk: {(aiResponse?.insights?.riskLevel || "medium").toUpperCase()}
                    </Text>
                  </>
                )}
              </ScrollView>
            )}
          </Animated.View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  aiTabBtn: {
    justifyContent: "center",
    alignItems: "center",
    marginTop: -14,
  },
  aiTabGlow: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: COLORS.primary,
    shadowOpacity: 0.55,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    maxHeight: "75%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  modalTitle: {
    color: COLORS.primary,
    fontWeight: "700",
    fontSize: 16,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.surface,
  },
  loadingWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
  },
  loadingText: {
    color: COLORS.textLight,
  },
  jsonBox: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 12,
  },
  jsonText: {
    color: COLORS.text,
    fontSize: 12,
    lineHeight: 18,
  },
  aiSummary: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 8,
  },
  aiBullet: {
    color: COLORS.text,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 3,
  },
  aiTip: {
    color: COLORS.textLight,
    fontSize: 12,
    marginTop: 6,
  },
  aiRisk: {
    marginTop: 10,
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "700",
  },
});
