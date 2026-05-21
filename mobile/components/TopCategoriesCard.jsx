import { Text, View } from "react-native";
import { styles } from "../assets/styles/home.styles";
import { DEFAULT_CURRENCY, formatCurrency } from "../lib/currency";

export const TopCategoriesCard = ({ title, data = [], currency = DEFAULT_CURRENCY }) => {
  return (
    <View style={styles.topCard}>
      <Text style={styles.topCardTitle}>{title}</Text>
      {data.length === 0 ? (
        <Text style={styles.topEmptyText}>No data for this month</Text>
      ) : (
        data.map((item) => (
          <View key={item.category} style={styles.topRow}>
            <View style={styles.topRowHeader}>
              <Text style={styles.topCategory}>{item.category}</Text>
              <Text style={styles.topPercent}>{Math.round(item.percentage)}%</Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${Math.max(item.percentage, 4)}%` }]} />
            </View>
            <Text style={styles.topAmount}>{formatCurrency(item.amount, currency)}</Text>
          </View>
        ))
      )}
    </View>
  );
};
