const buildPrompt = (dashboard) => {
  return `You are a personal finance assistant. Generate concise monthly insights from this JSON data:\n${JSON.stringify(
    dashboard
  )}\n\nReturn strict JSON with this exact schema:\n{\n  "oneLineSummary": "string",\n  "highlights": ["string", "string", "string"],\n  "tips": ["string", "string"],\n  "riskLevel": "low|medium|high"\n}\n\nRules:\n- Keep each line under 120 chars.\n- Mention concrete categories/changes from data.\n- No markdown. JSON only.`;
};

const parseModelJson = (text) => {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
};

const sampleFallbackInsights = {
  oneLineSummary:
    "Your spending pattern looks mostly stable this month, with routine expenses remaining manageable overall.",
  highlights: [
    "Daily spending stayed concentrated in regular categories such as food, transport, and personal needs.",
    "No major irregular expense spike was observed in the overall monthly activity.",
    "Income and expense flow appears balanced enough to maintain short-term financial stability.",
  ],
  tips: [
    "Try keeping a simple weekly spending limit to maintain consistency through the rest of the month.",
    "Review small frequent purchases, as minor recurring expenses can gradually affect the monthly balance.",
  ],
  riskLevel: "medium",
  fallback: true,
};

export async function generateMonthlyInsights(dashboard) {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";

  if (!apiKey) {
    return sampleFallbackInsights;
  }

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        input: buildPrompt(dashboard),
        temperature: 0.3,
        max_output_tokens: 300,
      }),
    });

    const payload = await response.json();
    const text = payload?.output_text || payload?.output?.[0]?.content?.[0]?.text || "";

    if (!response.ok) {
      return sampleFallbackInsights;
    }

    const parsed = parseModelJson(text);
    if (!parsed) {
      return sampleFallbackInsights;
    }

    return {
      oneLineSummary: parsed.oneLineSummary || "Monthly summary available.",
      highlights: Array.isArray(parsed.highlights) ? parsed.highlights.slice(0, 3) : [],
      tips: Array.isArray(parsed.tips) ? parsed.tips.slice(0, 2) : [],
      riskLevel: ["low", "medium", "high"].includes(parsed.riskLevel) ? parsed.riskLevel : "medium",
    };
  } catch {
    return sampleFallbackInsights;
  }
}
