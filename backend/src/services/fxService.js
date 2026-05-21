const ratesCache = new Map();

const getCacheKey = (base) => (base || "USD").toUpperCase();

export function convertAmount(amount, from, to, base, rates) {
  const safeAmount = Number(amount);
  if (!Number.isFinite(safeAmount)) return amount;

  const fromCode = (from || base || "USD").toUpperCase();
  const toCode = (to || fromCode).toUpperCase();
  const baseCode = (base || "USD").toUpperCase();

  if (fromCode === toCode) return safeAmount;
  if (!rates || !rates[fromCode] || !rates[toCode]) return safeAmount;

  const inBase = fromCode === baseCode ? safeAmount : safeAmount / rates[fromCode];
  return toCode === baseCode ? inBase : inBase * rates[toCode];
}

export async function fetchRates(base = "USD") {
  const normalizedBase = getCacheKey(base);
  const apiKey = process.env.EXCHANGE_RATE_API_KEY;
  const apiBase = process.env.EXCHANGE_RATE_API_BASE_URL;

  const cacheHit = ratesCache.get(normalizedBase);

  if (!apiKey || !apiBase) {
    return cacheHit || { base: normalizedBase, rates: { [normalizedBase]: 1 }, asOf: null, stale: true };
  }

  try {
    const url = `${apiBase}/${apiKey}/latest/${normalizedBase}`;
    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok || data.result !== "success") {
      throw new Error(data?.["error-type"] || "Failed to fetch FX rates");
    }

    const payload = {
      base: data.base_code,
      rates: data.conversion_rates,
      asOf: data.time_last_update_utc || new Date().toISOString(),
      stale: false,
    };

    ratesCache.set(normalizedBase, payload);
    return payload;
  } catch (error) {
    if (cacheHit) {
      return { ...cacheHit, stale: true };
    }

    return {
      base: normalizedBase,
      rates: { [normalizedBase]: 1 },
      asOf: null,
      stale: true,
      error: error.message,
    };
  }
}
