import { ActivityIndicator, Text, View } from "react-native";
import { styles } from "../assets/styles/home.styles";
import { COLORS } from "../constants/colors";

export const AIInsightsCard = ({ insights, isLoading }) => {
  return (
    <View style={styles.aiCard}>
      <Text style={styles.aiTitle}>AI Monthly Insights</Text>

      {isLoading ? (
        <View style={styles.aiLoadingRow}>
          <ActivityIndicator color={COLORS.primary} size="small" />
          <Text style={styles.aiLoadingText}>Generating insights...</Text>
        </View>
      ) : null}

      {insights ? (
        <>
          <Text style={styles.aiSummary}>{insights.oneLineSummary}</Text>

          {insights.highlights?.map((h, i) => (
            <Text key={`h_${i}`} style={styles.aiBullet}>
              • {h}
            </Text>
          ))}

          {insights.tips?.map((t, i) => (
            <Text key={`t_${i}`} style={styles.aiTip}>
              Tip: {t}
            </Text>
          ))}

          <Text style={styles.aiRisk}>Risk: {insights.riskLevel?.toUpperCase?.() || "MEDIUM"}</Text>
        </>
      ) : (
        <Text style={styles.aiEmpty}>No insights yet for this month.</Text>
      )}
    </View>
  );
};
