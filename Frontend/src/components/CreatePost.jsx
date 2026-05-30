import { useState, useEffect } from "react";
import { FaCameraRetro } from "react-icons/fa";
import { IoClose } from "react-icons/io5";
import { useDispatch } from "react-redux";
import { createPost } from "../features/posts/postsSlice";

const CreatePost = ({ onClose }) => {
  const dispatch = useDispatch();
  const [caption, setCaption] = useState("");
  const [image, setImage] = useState(null);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleImageChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type.startsWith("image/")) {
      if (image) URL.revokeObjectURL(image);
      setImage(URL.createObjectURL(selectedFile));
      setFile(selectedFile);
    } else {
      setError("Only image files are allowed.");
    }
  };

  useEffect(() => {
    return () => {
      if (image) URL.revokeObjectURL(image);
    };
  }, [image]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!caption.trim()) {
      setError("Caption is required.");
      return;
    }

    setLoading(true);
    setError("");

    const formData = new FormData();
    formData.append("content", caption);
    if (file) {
      formData.append("displayPicture", file);
    }

    try {
      await dispatch(createPost(formData)).unwrap();
      setCaption("");
      setImage(null);
      setFile(null);
      onClose?.();
    } catch (error) {
      setError(error || "Failed to create post. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-3 backdrop-blur-md sm:items-center">
      <div className="w-full max-w-lg overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b p-4">
          <h2 className="text-xl font-black text-gray-900">Create Post</h2>
          <button
            onClick={() => !loading && onClose()}
            className="rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-black"
          >
            <IoClose size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {error && <p className="text-red-500 text-sm mb-2">{error}</p>}

          {/* Caption Input */}
          <textarea
            placeholder="Write a caption..."
            value={caption}
            onChange={(e) => {
              setCaption(e.target.value);
              if (error) setError("");
            }}
            className="w-full resize-none rounded-2xl border p-3 focus:outline-none focus:ring-2 focus:ring-blue-200"
            rows="3"
          />

          {/* Image Upload */}
          {image ? (
            <img src={image} alt="Preview" className="mx-auto mt-3 max-h-60 max-w-full rounded-2xl object-contain" />
          ) : (
            <label className="mt-3 flex h-44 w-full cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-blue-100 bg-blue-50/60 transition hover:bg-blue-50">
              <FaCameraRetro size={40} className="text-gray-400" />
              <span className="text-gray-500 text-sm">
                Click to upload an image
              </span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
              />
            </label>
          )}

          {/* Post Button */}
          <button
            type="submit"
            className="mt-4 w-full rounded-2xl bg-blue-600 px-4 py-3 font-bold text-white hover:bg-blue-700 disabled:bg-gray-400"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Posting..." : "Post"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreatePost;
