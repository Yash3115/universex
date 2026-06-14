const KIND_LABELS = {
  summarize: "summary",
  simplify: "plain-language explanation",
  "action-items": "action item extraction",
  "study-notes": "student study notes",
  flashcards: "flashcard generation",
  "practice-questions": "practice question generation",
  glossary: "glossary generation",
  "dashboard-digest": "student academic digest",
  "professor-draft": "professor draft assistant",
  "moderation-triage": "moderation triage",
  "access-request-summary": "access request summary",
};

const buildAiMessages = ({ kind, sourceTitle, sourceType, sourceText, prompt = {}, userRole }) => {
  const kindLabel = KIND_LABELS[kind] || kind;
  const system = [
    "You are UniVerseX AI, an assistive campus platform helper.",
    "Return only valid JSON. Do not use markdown fences.",
    "Do not invent facts, marks, deadlines, or policy decisions.",
    "Keep responses concise and useful for students, professors, and admins.",
    "For moderation and admin work, recommend review steps but never make the final decision.",
  ].join(" ");

  const schema = {
    title: "short heading",
    summary: "short paragraph",
    bullets: ["3-6 concise bullets"],
    actionItems: ["clear next steps"],
    importantDates: ["dates or deadlines mentioned, empty if none"],
    flashcards: [{ front: "question", back: "answer" }],
    questions: [{ question: "practice question", answer: "short answer" }],
    glossary: [{ term: "term", definition: "definition" }],
    taskSuggestions: [{ title: "task", description: "why it matters", priority: "low|medium|high", dueDate: "" }],
    suggestedAction: "for admin/professor review only",
    category: "optional classification",
    confidence: "low|medium|high",
    draft: "draft text when requested",
  };

  const user = [
    `Task: ${kindLabel}.`,
    `Viewer role: ${userRole || "User"}.`,
    `Source type: ${sourceType}.`,
    `Source title: ${sourceTitle || "Untitled"}.`,
    `User prompt/context: ${JSON.stringify(prompt || {})}.`,
    `Required JSON shape: ${JSON.stringify(schema)}.`,
    "Use empty arrays for fields that do not apply.",
    "Source content:",
    sourceText || "No source text provided.",
  ].join("\n");

  return [
    { role: "system", content: system },
    { role: "user", content: user },
  ];
};

module.exports = {
  buildAiMessages,
};
