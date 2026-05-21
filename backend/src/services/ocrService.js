const receiptsStore = new Map();

const amountRegex = /(?:total|amount|grand total|balance due)?\s*[:\-]?\s*([\$€£]?\s*\d+[\.,]\d{2})/gi;
const isoDateRegex = /\b(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})\b/;
const altDateRegex = /\b(\d{1,2})[-\/](\d{1,2})[-\/](\d{2,4})\b/;

function normalizeAmount(raw) {
  if (!raw) return null;
  const cleaned = raw.replace(/[^\d.,-]/g, "").replace(/,/g, "");
  const parsed = Number.parseFloat(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

function extractAmount(rawText) {
  if (!rawText) return null;
  let match;
  let lastValid = null;

  while ((match = amountRegex.exec(rawText)) !== null) {
    const value = normalizeAmount(match[1]);
    if (value !== null) lastValid = value;
  }

  return lastValid;
}

function normalizeDate(text) {
  if (!text) return null;

  const isoMatch = text.match(isoDateRegex);
  if (isoMatch) {
    const [_, y, m, d] = isoMatch;
    return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  }

  const altMatch = text.match(altDateRegex);
  if (altMatch) {
    let [_, d, m, y] = altMatch;
    if (y.length === 2) y = `20${y}`;
    return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  }

  return null;
}

function extractMerchant(rawText) {
  if (!rawText) return "";
  const firstLine = rawText
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .find((line) => line.length > 2);

  return firstLine || "";
}

export async function scanReceipt({ imageBase64, imageUrl }) {
  const apiKey = process.env.OCR_SPACE_API_KEY;
  const apiUrl = process.env.OCR_SPACE_API_URL;

  if (!apiKey || !apiUrl) {
    throw new Error("OCR service is not configured");
  }

  const params = new URLSearchParams();
  params.append("apikey", apiKey);
  params.append("language", "eng");
  params.append("isOverlayRequired", "false");

  if (imageBase64) {
    params.append("base64Image", imageBase64);
  } else if (imageUrl) {
    params.append("url", imageUrl);
  }

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  const payload = await response.json();
  const parsedText = payload?.ParsedResults?.[0]?.ParsedText || "";

  if (!response.ok || !parsedText) {
    throw new Error("Scan failed, retry.");
  }

  const result = {
    id: `receipt_${Date.now()}`,
    extractedMerchant: extractMerchant(parsedText),
    extractedAmount: extractAmount(parsedText),
    extractedDate: normalizeDate(parsedText),
    rawText: parsedText,
    confidence: payload?.OCRExitCode === 1 ? 0.87 : 0.55,
  };

  receiptsStore.set(result.id, result);
  return result;
}

export function linkReceipt(receiptId, transactionId) {
  const found = receiptsStore.get(receiptId);
  if (!found) return null;

  const updated = { ...found, transactionId, linkedAt: new Date().toISOString() };
  receiptsStore.set(receiptId, updated);
  return updated;
}
