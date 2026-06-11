import { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { updateCourseMaterial, uploadCourseMaterial } from "../features/courseMaterials/courseMaterialsSlice";

const materialTypes = ["lecture", "notes", "reference", "lab", "syllabus", "assignment-brief", "recording", "link", "other"];
const statuses = ["draft", "published", "scheduled", "archived"];
const resourceKinds = ["file", "link", "recording", "mixed"];

const toDateInput = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 16);
};

const materialToForm = (material) => ({
  title: material?.title || "",
  description: material?.description || "",
  type: material?.type || "lecture",
  status: material?.status || "published",
  resourceKind: material?.resourceKind || "link",
  visibility: material?.visibility || "enrolled",
  tags: (material?.tags || []).join(", "),
  externalUrl: material?.externalUrl || "",
  pinned: Boolean(material?.pinned),
  allowDownload: material?.allowDownload !== false,
  week: material?.week || "",
  module: material?.module || "",
  topic: material?.topic || "",
  lectureDate: toDateInput(material?.lectureDate),
  releaseAt: toDateInput(material?.releaseAt),
});

const CourseMaterialEditorModal = ({ courseId, material, onClose }) => {
  const dispatch = useDispatch();
  const uploadStatus = useSelector((state) => state.courseMaterials.uploadStatus);
  const actionLoadingById = useSelector((state) => state.courseMaterials.actionLoadingById);
  const isEditing = Boolean(material?._id);
  const isSaving = isEditing ? Boolean(actionLoadingById[material._id]) : uploadStatus === "loading";
  const initialForm = useMemo(() => materialToForm(material), [material]);
  const [form, setForm] = useState(initialForm);
  const [file, setFile] = useState(null);

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const submit = async (event) => {
    event.preventDefault();
    const formData = new FormData();
    Object.entries(form).forEach(([key, value]) => formData.append(key, value));
    if (file) formData.append("materialFile", file);

    try {
      if (isEditing) {
        await dispatch(updateCourseMaterial({ courseId, materialId: material._id, formData })).unwrap();
        toast.success("Material updated");
      } else {
        await dispatch(uploadCourseMaterial({ courseId, formData })).unwrap();
        toast.success(form.status === "draft" ? "Draft saved" : "Material saved");
      }
      onClose();
    } catch (error) {
      toast.error(error || "Unable to save material");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <form className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl" onSubmit={submit}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-black uppercase tracking-wide text-blue-600">Course material</p>
            <h2 className="mt-1 text-2xl font-black text-gray-900">{isEditing ? "Edit material" : "Add lecture material"}</h2>
            <p className="mt-1 text-sm text-gray-500">Organize content by week, module, topic, and release timing.</p>
          </div>
          <button type="button" className="btn btn-sm rounded-xl" onClick={onClose} aria-label="Close material editor">
            X
          </button>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <label className="form-control">
            <span className="label-text font-bold text-gray-700">Title</span>
            <input className="input input-bordered mt-1 rounded-xl" value={form.title} onChange={(e) => update("title", e.target.value)} required />
          </label>
          <label className="form-control">
            <span className="label-text font-bold text-gray-700">Type</span>
            <select className="select select-bordered mt-1 rounded-xl" value={form.type} onChange={(e) => update("type", e.target.value)}>
              {materialTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </label>
          <label className="form-control">
            <span className="label-text font-bold text-gray-700">Status</span>
            <select className="select select-bordered mt-1 rounded-xl" value={form.status} onChange={(e) => update("status", e.target.value)}>
              {statuses.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </label>
          <label className="form-control">
            <span className="label-text font-bold text-gray-700">Visibility</span>
            <select className="select select-bordered mt-1 rounded-xl" value={form.visibility} onChange={(e) => update("visibility", e.target.value)}>
              <option value="enrolled">Enrolled students only</option>
              <option value="college">College visible</option>
              <option value="public">Public</option>
            </select>
          </label>
          <label className="form-control">
            <span className="label-text font-bold text-gray-700">Resource kind</span>
            <select className="select select-bordered mt-1 rounded-xl" value={form.resourceKind} onChange={(e) => update("resourceKind", e.target.value)}>
              {resourceKinds.map((kind) => (
                <option key={kind} value={kind}>{kind}</option>
              ))}
            </select>
          </label>
          <label className="form-control">
            <span className="label-text font-bold text-gray-700">Tags</span>
            <input className="input input-bordered mt-1 rounded-xl" value={form.tags} onChange={(e) => update("tags", e.target.value)} placeholder="arrays, lecture, quiz" />
          </label>
          <label className="form-control">
            <span className="label-text font-bold text-gray-700">Week</span>
            <input className="input input-bordered mt-1 rounded-xl" min="1" type="number" value={form.week} onChange={(e) => update("week", e.target.value)} />
          </label>
          <label className="form-control">
            <span className="label-text font-bold text-gray-700">Module</span>
            <input className="input input-bordered mt-1 rounded-xl" value={form.module} onChange={(e) => update("module", e.target.value)} placeholder="Unit 1" />
          </label>
          <label className="form-control md:col-span-2">
            <span className="label-text font-bold text-gray-700">Topic</span>
            <input className="input input-bordered mt-1 rounded-xl" value={form.topic} onChange={(e) => update("topic", e.target.value)} placeholder="Complexity analysis and arrays" />
          </label>
        </div>

        <label className="form-control mt-4">
          <span className="label-text font-bold text-gray-700">Description</span>
          <textarea className="textarea textarea-bordered mt-1 min-h-24 rounded-xl" value={form.description} onChange={(e) => update("description", e.target.value)} />
        </label>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="form-control">
            <span className="label-text font-bold text-gray-700">Upload file</span>
            <input className="file-input file-input-bordered mt-1 rounded-xl" type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            {material?.file?.originalName && <span className="mt-1 text-xs text-gray-500">Current file: {material.file.originalName}</span>}
          </label>
          <label className="form-control">
            <span className="label-text font-bold text-gray-700">External URL</span>
            <input className="input input-bordered mt-1 rounded-xl" value={form.externalUrl} onChange={(e) => update("externalUrl", e.target.value)} placeholder="https://..." />
          </label>
          <label className="form-control">
            <span className="label-text font-bold text-gray-700">Lecture date</span>
            <input className="input input-bordered mt-1 rounded-xl" type="datetime-local" value={form.lectureDate} onChange={(e) => update("lectureDate", e.target.value)} />
          </label>
          <label className="form-control">
            <span className="label-text font-bold text-gray-700">Release date</span>
            <input className="input input-bordered mt-1 rounded-xl" type="datetime-local" value={form.releaseAt} onChange={(e) => update("releaseAt", e.target.value)} required={form.status === "scheduled"} />
          </label>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 text-sm font-semibold text-gray-700">
            <input className="checkbox" type="checkbox" checked={form.pinned} onChange={(e) => update("pinned", e.target.checked)} />
            Pin this material
          </label>
          <label className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 text-sm font-semibold text-gray-700">
            <input className="checkbox" type="checkbox" checked={form.allowDownload} onChange={(e) => update("allowDownload", e.target.checked)} />
            Allow student file access
          </label>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" className="btn rounded-xl" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary rounded-xl" disabled={isSaving}>
            {isSaving ? "Saving..." : isEditing ? "Save changes" : "Save material"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CourseMaterialEditorModal;
