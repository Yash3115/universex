import { useState, useEffect } from "react";
import { FaCameraRetro } from "react-icons/fa";
import { IoClose } from "react-icons/io5";
import axios from "axios";

const CreatePost = ({ onClose }) => {
  const [caption, setCaption] = useState("");
  const [image, setImage] = useState(null);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleImageChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type.startsWith("image/")) {
      setImage(URL.createObjectURL(selectedFile));
      setFile(selectedFile);
    } else {
      setError("Only image files are allowed.");
    }
  };

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
      const API_URL ="https://universex-m5nn.vercel.app";
      const response = await axios.post(`${API_URL}/api/posts`, formData, {
        withCredentials: true,
      });

      console.log("Post created:", response.data);
      setCaption("");
      setImage(null);
      setFile(null);
      onClose();
    } catch (error) {
      console.error("Error creating post:", error);
      setError("Failed to create post. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-md">
      <div className="bg-white w-full mx-4 max-w-lg rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-semibold">Create Post</h2>
          <button
            onClick={() => !loading && onClose()}
            className="text-gray-500 hover:text-black"
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
            className="w-full p-2 border rounded-md resize-none focus:outline-none"
            rows="3"
          />

          {/* Image Upload */}
          {image ? (
            <img src={image} alt="Preview" className="mt-3 max-w-full max-h-60 mx-auto rounded-lg object-contain" />
          ) : (
            <label className="flex flex-col items-center justify-center w-full h-40 bg-gray-100 border border-dashed rounded-lg cursor-pointer mt-3">
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
            className="w-full bg-blue-500 text-white px-4 py-2 mt-4 rounded-md font-semibold hover:bg-blue-600 disabled:bg-gray-400"
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
