import { useCallback, useState } from "react";
import { API_URL } from "../constants/api";
import { fetchJson } from "../lib/api";

const monthToString = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

export const useDashboard = (userId, preferredCurrency) => {
  const [monthDate, setMonthDate] = useState(() => new Date());
  const [dashboard, setDashboard] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      const month = monthToString(monthDate);
      const data = await fetchJson(
        `${API_URL}/transactions/dashboard/${userId}?month=${encodeURIComponent(month)}&currency=${encodeURIComponent(preferredCurrency)}`
      );
      setDashboard(data);
    } catch (error) {
      console.log("Error loading dashboard", error);
    } finally {
      setIsLoading(false);
    }
  }, [userId, preferredCurrency, monthDate]);

  const prevMonth = () => {
    setMonthDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    const now = new Date();
    setMonthDate((prev) => {
      const candidate = new Date(prev.getFullYear(), prev.getMonth() + 1, 1);
      if (
        candidate.getFullYear() > now.getFullYear() ||
        (candidate.getFullYear() === now.getFullYear() && candidate.getMonth() > now.getMonth())
      ) {
        return prev;
      }
      return candidate;
    });
  };

  return { dashboard, isLoading, loadData, monthDate, prevMonth, nextMonth };
};
