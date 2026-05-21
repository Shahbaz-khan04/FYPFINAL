import { useUser } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Alert, FlatList, RefreshControl, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import PageLoader from "../../components/PageLoader";
import { TransactionItem } from "../../components/TransactionItem";
import NoTransactionsFound from "../../components/NoTransactionsFound";
import { styles } from "../../assets/styles/home.styles";
import { useTransactions } from "../../hooks/useTransactions";
import { useAppSettings } from "../../context/AppSettingsContext";

export default function TransactionsScreen() {
  const { user } = useUser();
  const router = useRouter();
  const { preferredCurrency, categories } = useAppSettings();
  const [refreshing, setRefreshing] = useState(false);
  const [filterType, setFilterType] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [sortBy, setSortBy] = useState("date_desc");

  const { transactions, isLoading, loadData, deleteTransaction } = useTransactions(
    user.id,
    preferredCurrency
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleDelete = (id) => {
    Alert.alert("Delete Transaction", "Are you sure you want to delete this transaction?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteTransaction(id) },
    ]);
  };

  const filtered = useMemo(() => {
    let result = [...transactions];

    if (filterType === "income") result = result.filter((t) => Number(t.amount) > 0);
    if (filterType === "expense") result = result.filter((t) => Number(t.amount) < 0);

    if (filterCategory !== "all") {
      result = result.filter((t) => t.category === filterCategory);
    }

    if (sortBy === "date_desc") {
      result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    } else if (sortBy === "date_asc") {
      result.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    } else if (sortBy === "amount_desc") {
      result.sort((a, b) => Math.abs(Number(b.amount)) - Math.abs(Number(a.amount)));
    } else if (sortBy === "amount_asc") {
      result.sort((a, b) => Math.abs(Number(a.amount)) - Math.abs(Number(b.amount)));
    }

    return result;
  }, [transactions, filterType, filterCategory, sortBy]);

  if (isLoading && !refreshing) return <PageLoader />;

  const categoryNames = ["all", ...categories.map((c) => c.name)];

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.transactionsHeaderContainer}>
          <Text style={styles.sectionTitle}>Transactions</Text>
          <TouchableOpacity style={styles.addButton} onPress={() => router.push("/create")}>
            <Ionicons name="add" size={20} color="#FFF" />
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.filterRow}>
          {["all", "income", "expense"].map((type) => (
            <TouchableOpacity
              key={type}
              style={[styles.filterChip, filterType === type && styles.filterChipActive]}
              onPress={() => setFilterType(type)}
            >
              <Text style={[styles.filterChipText, filterType === type && styles.filterChipTextActive]}>
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.filterRow}>
          {categoryNames.slice(0, 4).map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.filterChip, filterCategory === cat && styles.filterChipActive]}
              onPress={() => setFilterCategory(cat)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  filterCategory === cat && styles.filterChipTextActive,
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.filterRow}>
          {[
            ["date_desc", "Newest"],
            ["date_asc", "Oldest"],
            ["amount_desc", "Amount ↓"],
            ["amount_asc", "Amount ↑"],
          ].map(([key, label]) => (
            <TouchableOpacity
              key={key}
              style={[styles.filterChip, sortBy === key && styles.filterChipActive]}
              onPress={() => setSortBy(key)}
            >
              <Text style={[styles.filterChipText, sortBy === key && styles.filterChipTextActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <FlatList
        style={styles.transactionsList}
        contentContainerStyle={styles.transactionsListContent}
        data={filtered}
        renderItem={({ item }) => <TransactionItem item={item} onDelete={handleDelete} />}
        ListEmptyComponent={<NoTransactionsFound />}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      />
    </View>
  );
}
