import { buildDashboardData } from "./transactionsController.js";
import { generateMonthlyInsights } from "../services/aiInsightsService.js";

export async function getMonthlyInsights(req, res) {
  try {
    const { userId } = req.params;
    const currency = req.query.currency || "USD";
    const month = req.query.month;

    const dashboard = await buildDashboardData(userId, currency, month);
    const insights = await generateMonthlyInsights(dashboard);

    return res.status(200).json({
      month: dashboard.month,
      currency: dashboard.currency,
      insights,
    });
  } catch (error) {
    console.log("AI insights error", error);
    return res.status(500).json({ message: "Failed to generate AI monthly insights" });
  }
}
