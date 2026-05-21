export const DEFAULT_CURRENCY = "USD";

export const formatCurrency = (value, currency = DEFAULT_CURRENCY) => {
  const safeValue = Number(value) || 0;
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(safeValue);
  } catch {
    return `${currency} ${safeValue.toFixed(2)}`;
  }
};
