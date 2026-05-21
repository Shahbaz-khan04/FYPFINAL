import { fetchRates } from "../services/fxService.js";

export async function getRatesController(req, res) {
  try {
    const base = (req.query.base || "USD").toUpperCase();
    const data = await fetchRates(base);

    return res.status(200).json({
      base: data.base,
      rates: data.rates,
      asOf: data.asOf,
      stale: data.stale || false,
    });
  } catch (error) {
    console.log("FX rates error", error);
    return res.status(500).json({ message: "Failed to fetch FX rates" });
  }
}
