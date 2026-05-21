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

export async function generateMonthlyInsights(dashboard) {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";

  if (!apiKey) {
    return {
      oneLineSummary: "OpenAI key not configured.",
      highlights: ["Configure OPENAI_API_KEY to enable AI insights."],
      tips: ["Review top spending categories manually.", "Track month-over-month changes."],
      riskLevel: "medium",
      fallback: true,
    };
  }

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
    throw new Error(payload?.error?.message || "Failed to generate insights");
  }

  const parsed = parseModelJson(text);
  if (!parsed) {
    return {
      oneLineSummary: "Insights generated, but response format was unexpected.",
      highlights: [text.slice(0, 120) || "No highlight available"],
      tips: ["Try regenerate insights."],
      riskLevel: "medium",
      fallback: true,
    };
  }

  return {
    oneLineSummary: parsed.oneLineSummary || "Monthly summary available.",
    highlights: Array.isArray(parsed.highlights) ? parsed.highlights.slice(0, 3) : [],
    tips: Array.isArray(parsed.tips) ? parsed.tips.slice(0, 2) : [],
    riskLevel: ["low", "medium", "high"].includes(parsed.riskLevel) ? parsed.riskLevel : "medium",
  };
}
