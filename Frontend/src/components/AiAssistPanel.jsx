import { useMemo, useState } from "react";
import { FaMagic, FaPlusCircle, FaRegLightbulb } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { buildAiKey, generateAiArtifact } from "../features/ai/aiSlice";

const normalizeList = (items) => (Array.isArray(items) ? items.filter(Boolean) : []);

const renderObjectList = (items, renderItem) => {
  const list = normalizeList(items);
  if (list.length === 0) return null;
  return <div className="mt-3 grid gap-2">{list.slice(0, 6).map(renderItem)}</div>;
};

const AiContent = ({ content = {} }) => {
  const bullets = normalizeList(content.bullets);
  const actionItems = normalizeList(content.actionItems);
  const importantDates = normalizeList(content.importantDates);
  const taskSuggestions = normalizeList(content.taskSuggestions);

  return (
    <div className="mt-4 rounded-2xl border border-violet-100 bg-violet-50/60 p-4 text-sm text-slate-700">
      <div className="flex items-center gap-2 text-violet-700">
        <FaRegLightbulb aria-hidden="true" />
        <p className="font-black">{content.title || "AI-generated help"}</p>
      </div>
      {content.summary && <p className="mt-3 leading-6">{content.summary}</p>}
      {content.draft && <p className="mt-3 whitespace-pre-wrap rounded-xl bg-white p-3 leading-6">{content.draft}</p>}
      {bullets.length > 0 && (
        <ul className="mt-3 list-disc space-y-1 pl-5">
          {bullets.slice(0, 6).map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}
        </ul>
      )}
      {actionItems.length > 0 && (
        <div className="mt-3 rounded-xl bg-white p-3">
          <p className="font-black text-slate-900">Action items</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {actionItems.slice(0, 6).map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}
          </ul>
        </div>
      )}
      {importantDates.length > 0 && (
        <p className="mt-3 text-xs font-bold text-violet-700">Dates: {importantDates.join(", ")}</p>
      )}
      {renderObjectList(content.flashcards, (card, index) => (
        <div key={`${card.front}-${index}`} className="rounded-xl bg-white p-3">
          <p className="font-black text-slate-900">{card.front}</p>
          <p className="mt-1 text-slate-600">{card.back}</p>
        </div>
      ))}
      {renderObjectList(content.questions, (question, index) => (
        <div key={`${question.question}-${index}`} className="rounded-xl bg-white p-3">
          <p className="font-black text-slate-900">{question.question}</p>
          <p className="mt-1 text-slate-600">{question.answer}</p>
        </div>
      ))}
      {renderObjectList(content.glossary, (item, index) => (
        <div key={`${item.term}-${index}`} className="rounded-xl bg-white p-3">
          <p className="font-black text-slate-900">{item.term}</p>
          <p className="mt-1 text-slate-600">{item.definition}</p>
        </div>
      ))}
      {taskSuggestions.length > 0 && (
        <div className="mt-3 rounded-xl bg-white p-3">
          <p className="font-black text-slate-900">Suggested planner tasks</p>
          <div className="mt-2 grid gap-2">
            {taskSuggestions.slice(0, 4).map((task, index) => (
              <div key={`${task.title}-${index}`} className="rounded-lg bg-slate-50 p-2">
                <p className="font-bold text-slate-900">{task.title}</p>
                <p className="text-xs text-slate-500">{task.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      {(content.category || content.suggestedAction || content.confidence) && (
        <p className="mt-3 text-xs font-bold text-slate-500">
          {[content.category, content.suggestedAction, content.confidence ? `Confidence: ${content.confidence}` : ""].filter(Boolean).join(" - ")}
        </p>
      )}
      <p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-violet-500">AI-generated. Verify before acting.</p>
    </div>
  );
};

const AiAssistPanel = ({
  sourceType,
  sourceId,
  title = "AI assistant",
  description = "Generate a concise AI helper for this item.",
  actions = [],
  prompt = {},
  compact = false,
  onCreateTasks,
}) => {
  const dispatch = useDispatch();
  const [activeAction, setActiveAction] = useState(actions[0] || null);
  const { artifactsByKey, errorByKey, loadingByKey } = useSelector((state) => state.ai);

  const activePayload = useMemo(() => {
    if (!activeAction) return null;
    return {
      sourceType,
      sourceId,
      kind: activeAction.kind,
      prompt: { ...prompt, ...(activeAction.prompt || {}) },
    };
  }, [activeAction, prompt, sourceId, sourceType]);

  const activeKey = activePayload ? buildAiKey(activePayload) : "";
  const artifact = activeKey ? artifactsByKey[activeKey] : null;
  const isLoading = Boolean(loadingByKey[activeKey]);
  const error = errorByKey[activeKey];
  const taskSuggestions = artifact?.content?.taskSuggestions || [];

  const runAction = async (action) => {
    const payload = {
      sourceType,
      sourceId,
      kind: action.kind,
      prompt: { ...prompt, ...(action.prompt || {}) },
    };
    setActiveAction(action);
    try {
      await dispatch(generateAiArtifact(payload)).unwrap();
    } catch (result) {
      toast.error(result?.message || "AI request failed");
    }
  };

  if (!actions.length) return null;

  return (
    <section className={`rounded-2xl border border-violet-100 bg-white ${compact ? "p-3" : "p-4"} shadow-sm`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wide text-violet-700">
            <FaMagic aria-hidden="true" /> {title}
          </p>
          {!compact && <p className="mt-1 text-sm text-slate-500">{description}</p>}
        </div>
        {artifact?.cached && <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">Cached</span>}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {actions.map((action) => (
          <button
            key={`${action.kind}:${action.label}`}
            type="button"
            className={`btn btn-xs rounded-xl ${activeAction?.label === action.label ? "btn-primary" : "bg-violet-50 text-violet-700"}`}
            disabled={isLoading}
            onClick={() => runAction(action)}
          >
            {isLoading && activeAction?.label === action.label ? "Generating..." : action.label}
          </button>
        ))}
      </div>
      {error && <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}
      {artifact?.content && <AiContent content={artifact.content} />}
      {onCreateTasks && taskSuggestions.length > 0 && (
        <button
          type="button"
          className="btn btn-sm mt-3 rounded-xl bg-white"
          onClick={() => onCreateTasks(taskSuggestions)}
        >
          <FaPlusCircle /> Create planner tasks
        </button>
      )}
    </section>
  );
};

export default AiAssistPanel;
