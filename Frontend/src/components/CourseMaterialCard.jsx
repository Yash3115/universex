import { FaArchive, FaBookmark, FaCheckCircle, FaEdit, FaExternalLinkAlt, FaRegBookmark, FaThumbtack, FaTrash } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import {
  deleteCourseMaterial,
  markCourseMaterialRead,
  toggleCourseMaterialBookmark,
  updateCourseMaterial,
} from "../features/courseMaterials/courseMaterialsSlice";
import AiAssistPanel from "./AiAssistPanel";

const statusTone = {
  draft: "bg-slate-100 text-slate-700",
  published: "bg-emerald-50 text-emerald-700",
  scheduled: "bg-amber-50 text-amber-700",
  archived: "bg-red-50 text-red-700",
};

const typeTone = {
  lecture: "bg-blue-50 text-blue-700",
  notes: "bg-cyan-50 text-cyan-700",
  reference: "bg-purple-50 text-purple-700",
  lab: "bg-emerald-50 text-emerald-700",
  syllabus: "bg-indigo-50 text-indigo-700",
  "assignment-brief": "bg-orange-50 text-orange-700",
  recording: "bg-rose-50 text-rose-700",
  link: "bg-sky-50 text-sky-700",
  other: "bg-slate-100 text-slate-700",
};

const formatBytes = (bytes = 0) => {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatDate = (date, fallback = "Not set") => {
  if (!date) return fallback;
  return new Date(date).toLocaleString([], { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
};

const buildPatchForm = (fields) => {
  const formData = new FormData();
  Object.entries(fields).forEach(([key, value]) => formData.append(key, value ?? ""));
  return formData;
};

const CourseMaterialCard = ({ courseId, isInstructor, material, onEdit }) => {
  const dispatch = useDispatch();
  const loadingById = useSelector((state) => state.courseMaterials.actionLoadingById);
  const isLoading = Boolean(loadingById[material._id]);
  const isReadLoading = Boolean(loadingById[`${material._id}:read`]);
  const isBookmarkLoading = Boolean(loadingById[`${material._id}:bookmark`]);
  const url = material.externalUrl || material.file?.url;
  const hasBlockedFile = Boolean(material.file?.originalName && !material.allowDownload && !isInstructor && !material.externalUrl);

  const remove = async () => {
    if (!window.confirm("Delete this material?")) return;
    try {
      await dispatch(deleteCourseMaterial({ courseId, materialId: material._id })).unwrap();
      toast.success("Material deleted");
    } catch (error) {
      toast.error(error || "Unable to delete material");
    }
  };

  const patchMaterial = async (fields, successMessage) => {
    try {
      await dispatch(updateCourseMaterial({ courseId, materialId: material._id, formData: buildPatchForm(fields) })).unwrap();
      toast.success(successMessage);
    } catch (error) {
      toast.error(error || "Unable to update material");
    }
  };

  const markRead = async () => {
    try {
      await dispatch(markCourseMaterialRead({ courseId, materialId: material._id })).unwrap();
    } catch (error) {
      toast.error(error || "Unable to mark material as read");
    }
  };

  const bookmark = async () => {
    try {
      await dispatch(toggleCourseMaterialBookmark({ courseId, materialId: material._id })).unwrap();
    } catch (error) {
      toast.error(error || "Unable to update bookmark");
    }
  };

  const openMaterial = () => {
    if (!material.isRead && !isInstructor) markRead();
  };

  return (
    <article className={`rounded-2xl border bg-white p-5 shadow-lg shadow-slate-200/70 ${material.isRead ? "border-slate-100" : "border-blue-200"}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap gap-2 text-xs">
            {material.pinned && <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 font-bold text-amber-700"><FaThumbtack /> Pinned</span>}
            <span className={`rounded-full px-3 py-1 font-bold capitalize ${typeTone[material.type] || typeTone.other}`}>{material.type}</span>
            {isInstructor && <span className={`rounded-full px-3 py-1 font-bold capitalize ${statusTone[material.status] || statusTone.published}`}>{material.status}</span>}
            <span className="rounded-full bg-slate-100 px-3 py-1 font-bold text-slate-600">v{material.version || 1}</span>
            {!isInstructor && !material.isRead && <span className="rounded-full bg-blue-50 px-3 py-1 font-bold text-blue-700">Unread</span>}
          </div>
          <h3 className="mt-3 text-lg font-black text-gray-900">{material.title}</h3>
          {(material.week || material.module || material.topic) && (
            <p className="mt-1 text-sm font-semibold text-gray-500">
              {material.week ? `Week ${material.week}` : "Course"} {material.module ? `- ${material.module}` : ""} {material.topic ? `- ${material.topic}` : ""}
            </p>
          )}
        </div>
      </div>

      {material.description && <p className="mt-3 text-sm leading-6 text-gray-600">{material.description}</p>}

      <div className="mt-3 grid gap-2 text-xs text-gray-500 sm:grid-cols-2">
        <p><span className="font-bold text-gray-700">Lecture:</span> {formatDate(material.lectureDate, "No lecture date")}</p>
        <p><span className="font-bold text-gray-700">Release:</span> {formatDate(material.releaseAt || material.publishedAt || material.createdAt)}</p>
        {material.uploadedBy && <p><span className="font-bold text-gray-700">Professor:</span> {material.uploadedBy.firstName} {material.uploadedBy.lastName}</p>}
        <p><span className="font-bold text-gray-700">Access:</span> {material.allowDownload ? "Open/download allowed" : "File download disabled"}</p>
      </div>

      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        {(material.tags || []).map((tag) => (
          <span key={tag} className="rounded-full bg-purple-50 px-3 py-1 text-purple-700">{tag}</span>
        ))}
      </div>

      {material.file?.originalName && (
        <p className="mt-3 text-xs text-gray-400">
          {material.file.originalName} {formatBytes(material.file.bytes)}
        </p>
      )}
      {isInstructor && (
        <p className="mt-2 text-xs text-gray-400">
          {material.readCount || 0} read - {material.bookmarkCount || 0} bookmarked
        </p>
      )}

      <div className="mt-5 flex flex-wrap gap-2">
        {url ? (
          <a className="btn btn-primary btn-sm rounded-xl" href={url} target="_blank" rel="noreferrer" onClick={openMaterial}>
            <FaExternalLinkAlt /> Open
          </a>
        ) : (
          <button className="btn btn-sm rounded-xl" disabled>{hasBlockedFile ? "Download disabled" : "No resource"}</button>
        )}

        {isInstructor ? (
          <>
            <button className="btn btn-sm rounded-xl" type="button" onClick={() => onEdit(material)} title="Edit material">
              <FaEdit /> Edit
            </button>
            <button
              className="btn btn-sm rounded-xl"
              type="button"
              disabled={isLoading}
              onClick={() =>
                patchMaterial(
                  material.status === "published" ? { status: "archived" } : { status: "published", releaseAt: "" },
                  material.status === "published" ? "Material archived" : "Material published"
                )
              }
              title={material.status === "published" ? "Archive material" : "Publish material"}
            >
              <FaArchive /> {material.status === "published" ? "Archive" : "Publish"}
            </button>
            <button
              className="btn btn-sm rounded-xl"
              type="button"
              disabled={isLoading}
              onClick={() => patchMaterial({ pinned: !material.pinned }, material.pinned ? "Material unpinned" : "Material pinned")}
              title={material.pinned ? "Unpin material" : "Pin material"}
            >
              <FaThumbtack /> {material.pinned ? "Unpin" : "Pin"}
            </button>
            <button className="btn btn-error btn-sm rounded-xl" type="button" disabled={isLoading} onClick={remove} title="Delete material">
              <FaTrash /> Delete
            </button>
          </>
        ) : (
          <>
            <button className="btn btn-sm rounded-xl" type="button" disabled={isReadLoading || material.isRead} onClick={markRead}>
              <FaCheckCircle /> {material.isRead ? "Read" : "Mark read"}
            </button>
            <button className="btn btn-sm rounded-xl" type="button" disabled={isBookmarkLoading} onClick={bookmark}>
              {material.isBookmarked ? <FaBookmark /> : <FaRegBookmark />} {material.isBookmarked ? "Saved" : "Save"}
            </button>
          </>
        )}
      </div>
      <div className="mt-4">
        <AiAssistPanel
          compact
          sourceType="material"
          sourceId={material._id}
          title={isInstructor ? "AI material copilot" : "AI study assistant"}
          description="Generate summaries and study helpers for this material."
          prompt={{ title: material.title, type: material.type, topic: material.topic }}
          actions={[
            { kind: "summarize", label: "Summary" },
            { kind: "simplify", label: "Simplify" },
            { kind: "study-notes", label: "Study notes" },
            { kind: "flashcards", label: "Flashcards" },
            { kind: "practice-questions", label: "Practice" },
            { kind: "glossary", label: "Glossary" },
          ]}
        />
      </div>
    </article>
  );
};

export default CourseMaterialCard;
