import { useUser } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import PageLoader from "../../components/PageLoader";
import { styles } from "../../assets/styles/home.styles";
import { useAppSettings } from "../../context/AppSettingsContext";
import { useDashboard } from "../../hooks/useDashboard";
import { formatCurrency } from "../../lib/currency";
import { TrendCard } from "../../components/TrendCard";
import { TopCategoriesCard } from "../../components/TopCategoriesCard";

const monthLabel = (date) =>
  date.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

export default function Page() {
  const { user } = useUser();
  const router = useRouter();
  const { preferredCurrency } = useAppSettings();
  const { dashboard, isLoading, loadData, monthDate, prevMonth, nextMonth } = useDashboard(
    user.id,
    preferredCurrency
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (isLoading || !dashboard) return <PageLoader />;

  const change = dashboard.summary.changeVsLastMonth;
  const username =
    user?.firstName ||
    user?.unsafeMetadata?.firstName ||
    user?.emailAddresses?.[0]?.emailAddress?.split("@")[0] ||
    "there";

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.dashboardScrollContent}
    >
      <View style={styles.stickyHeaderWrap}>
        <View style={styles.content}>
          <View style={styles.topHeaderRow}>
            <View>
              <Text style={styles.topHelloText}>Hello</Text>
              <Text style={styles.topUserText}>{username}</Text>
            </View>
            <Text style={styles.topBrandText}>MONEYLENS</Text>
            <View style={styles.topHeaderSpacer} />
          </View>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.monthHeaderRow}>
          <TouchableOpacity style={styles.monthNavBtn} onPress={prevMonth}>
            <Ionicons name="chevron-back" size={20} color={"#D8EEFF"} />
          </TouchableOpacity>
          <View style={styles.monthTitleWrap}>
            <Text style={styles.monthTitle}>{monthLabel(monthDate)}</Text>
            <Text style={styles.monthSubTitle}>OVERVIEW</Text>
          </View>
          <TouchableOpacity style={styles.monthNavBtn} onPress={nextMonth}>
            <Ionicons name="chevron-forward" size={20} color={"#D8EEFF"} />
          </TouchableOpacity>
        </View>

        <View style={styles.balanceCard}>
          <Text style={styles.balanceTitle}>TOTAL BALANCE</Text>
          <Text style={styles.balanceAmount}>
            {formatCurrency(dashboard.summary.balance, dashboard.currency)}
          </Text>
          <Text style={styles.balanceDelta}>
            {change === null ? "" : `${change >= 0 ? "+" : ""}${change.toFixed(1)}% vs last month`}
          </Text>
        </View>

        <TrendCard trend={dashboard.trend} currency={dashboard.currency} />

        <TopCategoriesCard
          title="Top Spending"
          data={dashboard.topSpendingCategories}
          currency={dashboard.currency}
        />

        <TopCategoriesCard
          title="Top Income"
          data={dashboard.topIncomeCategories}
          currency={dashboard.currency}
        />

        <TouchableOpacity style={styles.addButton} onPress={() => router.push("/create")}>
          <Ionicons name="add" size={20} color="#041018" />
          <Text style={styles.addButtonText}>Add Transaction</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
