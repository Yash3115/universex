import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { deleteCourseMaterial } from "../features/courseMaterials/courseMaterialsSlice";

const formatBytes = (bytes = 0) => {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const CourseMaterialCard = ({ courseId, isInstructor, material }) => {
  const dispatch = useDispatch();
  const isDeleting = useSelector((state) => Boolean(state.courseMaterials.actionLoadingById[material._id]));
  const url = material.file?.url || material.externalUrl;

  const remove = async () => {
    if (!window.confirm("Delete this material?")) return;
    try {
      await dispatch(deleteCourseMaterial({ courseId, materialId: material._id })).unwrap();
      toast.success("Material deleted");
    } catch (error) {
      toast.error(error || "Unable to delete material");
    }
  };

  return (
    <article className="rounded-3xl bg-white p-5 shadow-xl shadow-slate-200/70">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap gap-2 text-xs">
            {material.pinned && <span className="rounded-full bg-amber-50 px-3 py-1 font-bold text-amber-700">Pinned</span>}
            <span className="rounded-full bg-blue-50 px-3 py-1 font-bold capitalize text-blue-700">{material.type}</span>
            <span className="rounded-full bg-slate-100 px-3 py-1 font-bold text-slate-600">{material.visibility}</span>
          </div>
          <h3 className="mt-3 text-lg font-black text-gray-900">{material.title}</h3>
        </div>
      </div>
      {material.description && <p className="mt-3 text-sm leading-6 text-gray-600">{material.description}</p>}
      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        {(material.tags || []).map((tag) => <span key={tag} className="rounded-full bg-purple-50 px-3 py-1 text-purple-700">{tag}</span>)}
      </div>
      {material.file?.originalName && <p className="mt-3 text-xs text-gray-400">{material.file.originalName} {formatBytes(material.file.bytes)}</p>}
      <p className="mt-1 text-xs text-gray-400">Uploaded {new Date(material.publishedAt || material.createdAt).toLocaleString()}</p>
      <div className="mt-5 grid grid-cols-2 gap-2">
        {url ? <a className="btn btn-primary rounded-2xl" href={url} target="_blank" rel="noreferrer">Open</a> : <button className="btn rounded-2xl" disabled>No file</button>}
        {isInstructor ? <button className="btn rounded-2xl bg-red-50 text-red-600 hover:bg-red-100" disabled={isDeleting} onClick={remove}>{isDeleting ? "Deleting..." : "Delete"}</button> : <button className="btn rounded-2xl" disabled>Saved soon</button>}
      </div>
    </article>
  );
};

export default CourseMaterialCard;