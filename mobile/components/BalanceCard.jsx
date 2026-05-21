import { View, Text } from "react-native";
import { styles } from "../assets/styles/home.styles";
import { COLORS } from "../constants/colors";
import { DEFAULT_CURRENCY, formatCurrency } from "../lib/currency";

export const BalanceCard = ({ summary }) => {
  const currency = summary?.currency || DEFAULT_CURRENCY;

  return (
    <View style={styles.balanceCard}>
      <Text style={styles.balanceTitle}>Total Balance</Text>
      <Text style={styles.balanceAmount}>{formatCurrency(summary.balance, currency)}</Text>
      <View style={styles.balanceStats}>
        <View style={styles.balanceStatItem}>
          <Text style={styles.balanceStatLabel}>Income</Text>
          <Text style={[styles.balanceStatAmount, { color: COLORS.income }]}>
            {formatCurrency(summary.income, currency)}
          </Text>
        </View>
        <View style={[styles.balanceStatItem, styles.statDivider]} />
        <View style={styles.balanceStatItem}>
          <Text style={styles.balanceStatLabel}>Expenses</Text>
          <Text style={[styles.balanceStatAmount, { color: COLORS.expense }]}>
            {formatCurrency(summary.expenses, currency)}
          </Text>
        </View>
      </View>
    </View>
  );
};
