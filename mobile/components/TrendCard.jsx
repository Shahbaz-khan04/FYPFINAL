import { Text, View } from "react-native";
import { styles } from "../assets/styles/home.styles";
import { formatCurrency } from "../lib/currency";

const toShortMonth = (monthKey) => {
  const [y, m] = monthKey.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1, 1));
  return d.toLocaleString("en-US", { month: "short" });
};

const compactCurrency = (value, currency) => {
  const abs = Math.abs(value);
  if (abs >= 1000) return `${value < 0 ? "-" : ""}${currency} ${(abs / 1000).toFixed(1)}k`;
  return formatCurrency(value, currency);
};

export const TrendCard = ({ trend = [], currency }) => {
  const max = Math.max(...trend.map((t) => t.balance), 1);
  const min = Math.min(...trend.map((t) => t.balance), 0);
  const range = Math.max(max - min, 1);
  const yTop = max;
  const yMid = min + range / 2;
  const yBottom = min;

  return (
    <View style={styles.trendCard}>
      <Text style={styles.trendTitle}>Net Worth Trend</Text>
      <View style={styles.trendChartRow}>
        <View style={styles.yAxis}>
          <Text style={styles.yAxisLabel}>{compactCurrency(yTop, currency)}</Text>
          <Text style={styles.yAxisLabel}>{compactCurrency(yMid, currency)}</Text>
          <Text style={styles.yAxisLabel}>{compactCurrency(yBottom, currency)}</Text>
        </View>
        <View style={styles.barsRow}>
        {trend.map((point, idx) => {
          const normalized = (point.balance - min) / range;
          const h = Math.max(normalized * 110, 10);
          const active = idx === trend.length - 1;
          return (
            <View key={point.month} style={styles.barWrap}>
              <View
                style={[
                  styles.bar,
                  { height: h },
                  active ? styles.barActive : null,
                ]}
              />
              <Text style={styles.barLabel}>{toShortMonth(point.month)}</Text>
            </View>
          );
        })}
        </View>
      </View>
    </View>
  );
};
