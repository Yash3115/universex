import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { uploadCourseMaterial } from "../features/courseMaterials/courseMaterialsSlice";

const materialTypes = ["lecture", "notes", "reference", "lab", "syllabus", "assignment-brief", "recording", "link", "other"];

const CourseMaterialUploadModal = ({ courseId, onClose }) => {
  const dispatch = useDispatch();
  const uploadStatus = useSelector((state) => state.courseMaterials.uploadStatus);
  const [form, setForm] = useState({ title: "", description: "", type: "lecture", visibility: "enrolled", tags: "", externalUrl: "", pinned: false });
  const [file, setFile] = useState(null);

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const submit = async (event) => {
    event.preventDefault();
    const formData = new FormData();
    Object.entries(form).forEach(([key, value]) => formData.append(key, value));
    if (file) formData.append("materialFile", file);

    try {
      await dispatch(uploadCourseMaterial({ courseId, formData })).unwrap();
      toast.success("Material uploaded");
      onClose();
    } catch (error) {
      toast.error(error || "Unable to upload material");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <form className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl" onSubmit={submit}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-black uppercase tracking-wide text-blue-600">Course material</p>
            <h2 className="mt-1 text-2xl font-black text-gray-900">Upload material</h2>
          </div>
          <button type="button" className="btn btn-sm rounded-xl" onClick={onClose}>✕</button>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <input className="input input-bordered rounded-2xl" value={form.title} onChange={(e) => update("title", e.target.value)} placeholder="Title" required />
          <select className="select select-bordered rounded-2xl" value={form.type} onChange={(e) => update("type", e.target.value)}>
            {materialTypes.map((type) => <option key={type} value={type}>{type}</option>)}
          </select>
          <select className="select select-bordered rounded-2xl" value={form.visibility} onChange={(e) => update("visibility", e.target.value)}>
            <option value="enrolled">Enrolled students only</option>
            <option value="college">College visible</option>
            <option value="public">Public</option>
          </select>
          <input className="input input-bordered rounded-2xl" value={form.tags} onChange={(e) => update("tags", e.target.value)} placeholder="Tags, comma separated" />
        </div>
        <textarea className="textarea textarea-bordered mt-4 min-h-24 w-full rounded-2xl" value={form.description} onChange={(e) => update("description", e.target.value)} placeholder="Description" />
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <input className="file-input file-input-bordered rounded-2xl" type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          <input className="input input-bordered rounded-2xl" value={form.externalUrl} onChange={(e) => update("externalUrl", e.target.value)} placeholder="Or external URL" />
        </div>
        <label className="mt-4 flex items-center gap-2 text-sm font-semibold text-gray-600">
          <input className="checkbox" type="checkbox" checked={form.pinned} onChange={(e) => update("pinned", e.target.checked)} /> Pin this material
        </label>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" className="btn rounded-2xl" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary rounded-2xl" disabled={uploadStatus === "loading"}>{uploadStatus === "loading" ? "Uploading..." : "Upload"}</button>
        </div>
      </form>
    </div>
  );
};

export default CourseMaterialUploadModal;