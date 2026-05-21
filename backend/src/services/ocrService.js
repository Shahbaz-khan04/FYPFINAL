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

async function parseJsonSafe(response) {
  const raw = await response.text();
  try {
    return { data: JSON.parse(raw), raw };
  } catch {
    return { data: null, raw };
  }
}

async function scanWithOcrSpace({ imageBase64, imageUrl }) {
  const apiKey = process.env.OCR_SPACE_API_KEY;
  const apiUrl = process.env.OCR_SPACE_API_URL;
  if (!apiKey || !apiUrl) return null;

  const params = new URLSearchParams();
  params.append("apikey", apiKey);
  params.append("language", "eng");
  params.append("isOverlayRequired", "false");

  if (imageBase64) params.append("base64Image", imageBase64);
  else if (imageUrl) params.append("url", imageUrl);

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  const { data: payload } = await parseJsonSafe(response);
  if (!payload) return null;

  const parsedText = payload?.ParsedResults?.[0]?.ParsedText || "";
  if (!response.ok || !parsedText) return null;

  return {
    extractedMerchant: extractMerchant(parsedText),
    extractedAmount: extractAmount(parsedText),
    extractedDate: normalizeDate(parsedText),
    rawText: parsedText,
    confidence: payload?.OCRExitCode === 1 ? 0.87 : 0.55,
    provider: "ocr-space",
  };
}

async function scanWithOpenAI({ imageBase64, imageUrl }) {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";
  if (!apiKey) return null;

  const imageInput = imageBase64
    ? [{ type: "input_image", image_url: imageBase64 }]
    : imageUrl
      ? [{ type: "input_image", image_url: imageUrl }]
      : [];

  if (imageInput.length === 0) return null;

  const prompt = `Extract receipt fields and OCR text. Return strict JSON with:
{
  "extractedMerchant": string|null,
  "extractedAmount": number|null,
  "extractedDate": "YYYY-MM-DD"|null,
  "rawText": string,
  "confidence": number
}
Use null when unsure.`;

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      input: [
        {
          role: "user",
          content: [{ type: "input_text", text: prompt }, ...imageInput],
        },
      ],
      max_output_tokens: 500,
      temperature: 0.1,
    }),
  });

  const { data: payload } = await parseJsonSafe(response);
  if (!response.ok || !payload) return null;

  const text = payload?.output_text || payload?.output?.[0]?.content?.[0]?.text || "";
  if (!text) return null;

  let parsed = null;
  try {
    parsed = JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        parsed = JSON.parse(match[0]);
      } catch {
        parsed = null;
      }
    }
  }

  if (!parsed) return null;

  return {
    extractedMerchant: parsed.extractedMerchant || null,
    extractedAmount:
      typeof parsed.extractedAmount === "number"
        ? parsed.extractedAmount
        : normalizeAmount(String(parsed.extractedAmount || "")),
    extractedDate: parsed.extractedDate || null,
    rawText: parsed.rawText || "",
    confidence: Number.isFinite(parsed.confidence) ? parsed.confidence : 0.75,
    provider: "openai",
  };
}

export async function scanReceipt({ imageBase64, imageUrl }) {
  const ocrSpaceResult = await scanWithOcrSpace({ imageBase64, imageUrl });
  const aiResult = ocrSpaceResult ? null : await scanWithOpenAI({ imageBase64, imageUrl });
  const chosen = ocrSpaceResult || aiResult;

  if (!chosen) {
    throw new Error("Scan failed, retry.");
  }

  const result = {
    id: `receipt_${Date.now()}`,
    extractedMerchant: chosen.extractedMerchant,
    extractedAmount: chosen.extractedAmount,
    extractedDate: chosen.extractedDate,
    rawText: chosen.rawText,
    confidence: chosen.confidence,
    provider: chosen.provider,
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
