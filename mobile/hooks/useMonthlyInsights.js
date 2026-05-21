import { useCallback, useState } from "react";
import { API_URL } from "../constants/api";

export const useMonthlyInsights = (userId) => {
  const [cache, setCache] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const loadInsights = useCallback(
    async ({ month, currency }) => {
      if (!userId || !month || !currency) return null;
      const key = `${month}_${currency}`;

      if (cache[key]) return cache[key];

      setIsLoading(true);
      try {
        const response = await fetch(
          `${API_URL}/ai/monthly-insights/${userId}?month=${encodeURIComponent(month)}&currency=${encodeURIComponent(currency)}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
          }
        );
        const data = await response.json();
        const insights = data?.insights || null;
        setCache((prev) => ({ ...prev, [key]: insights }));
        return insights;
      } catch (error) {
        console.log("Failed to load AI insights", error);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [userId, cache]
  );

  const getCached = useCallback(
    ({ month, currency }) => cache[`${month}_${currency}`] || null,
    [cache]
  );

  return { loadInsights, getCached, isLoading };
};
