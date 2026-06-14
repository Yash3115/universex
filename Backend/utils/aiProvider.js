const GROQ_CHAT_COMPLETIONS_URL = "https://api.groq.com/openai/v1/chat/completions";

const getAiConfig = () => {
  const provider = String(process.env.AI_PROVIDER || "groq").toLowerCase();
  const enabled = String(process.env.AI_ENABLED || "false").toLowerCase() === "true";
  const model = process.env.GROQ_MODEL || process.env.AI_MODEL || "llama-3.1-8b-instant";

  return {
    enabled,
    provider,
    model,
    apiKey: process.env.GROQ_API_KEY || process.env.AI_API_KEY || "",
  };
};

const extractRateLimitHeaders = (headers) => ({
  limitRequests: headers.get("x-ratelimit-limit-requests") || "",
  remainingRequests: headers.get("x-ratelimit-remaining-requests") || "",
  resetRequests: headers.get("x-ratelimit-reset-requests") || "",
  limitTokens: headers.get("x-ratelimit-limit-tokens") || "",
  remainingTokens: headers.get("x-ratelimit-remaining-tokens") || "",
  resetTokens: headers.get("x-ratelimit-reset-tokens") || "",
  retryAfter: headers.get("retry-after") || "",
});

const extractJson = (text = "") => {
  try {
    return JSON.parse(text);
  } catch (_error) {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch (_nestedError) {
      return null;
    }
  }
};

const callGroq = async ({ messages, model }) => {
  const config = getAiConfig();
  if (!config.enabled) {
    const error = new Error("AI features are currently disabled");
    error.status = 503;
    throw error;
  }
  if (config.provider !== "groq") {
    const error = new Error("Only Groq is configured for this deployment");
    error.status = 503;
    throw error;
  }
  if (!config.apiKey) {
    const error = new Error("Groq API key is not configured");
    error.status = 503;
    throw error;
  }
  if (typeof fetch !== "function") {
    const error = new Error("This Node runtime does not support fetch");
    error.status = 503;
    throw error;
  }

  const response = await fetch(GROQ_CHAT_COMPLETIONS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: model || config.model,
      temperature: 0.25,
      max_tokens: 900,
      messages,
    }),
  });

  const rateLimit = extractRateLimitHeaders(response.headers);
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(payload.error?.message || "AI provider request failed");
    error.status = response.status === 429 ? 429 : 502;
    error.rateLimit = rateLimit;
    throw error;
  }

  const raw = payload.choices?.[0]?.message?.content || "{}";
  const parsed = extractJson(raw);
  return {
    content: parsed || { title: "AI response", summary: raw, bullets: [], actionItems: [], importantDates: [] },
    usage: payload.usage || {},
    rateLimit,
    provider: "groq",
    model: payload.model || model || config.model,
  };
};

const generateAiResponse = async (input) => callGroq(input);

module.exports = {
  generateAiResponse,
  getAiConfig,
};
