import { useState, useEffect, useCallback } from "react";
import { FaPaperPlane, FaHeart, FaReply, FaEllipsisH } from "react-icons/fa";
import { useSelector } from "react-redux";
import api from "../services/api";
import { getImageUrl } from "../utils/imageUtils";

const CommentBox = ({ postId }) => {
  const user = useSelector((state) => state.auth.user);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);

  // ✅ Memoize fetchComments to prevent infinite loops
  const fetchComments = useCallback(async () => {
    try {
      const res = await api.get(`/api/comments/${postId}/comments`);
      setComments(res.data.comments);
    } catch (err) {
      console.error("Error fetching comments:", err);
    }
  }, [postId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]); // ✅ Only runs when postId changes

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setLoading(true);
    try {
      await api.post(
        `/api/comments/${postId}/comments`,
        { content: newComment },
        { withCredentials: true }
      );
      setNewComment("");
      fetchComments(); // ✅ Fetch new comments after posting
    } catch (err) {
      console.error("Error adding comment:", err);
    }
    setLoading(false);
  };

  return (
    <div className="bg-white p-4 rounded-lg border my-2 border-gray-300">
      {/* Comment Input Box */}
      <div className="flex items-center gap-3 border rounded-full px-3 py-2 mb-4">
        <img src={getImageUrl(user?.image, "https://cdn-icons-png.flaticon.com/512/6596/6596121.png")} alt="User" className="w-10 h-10 rounded-full" />
        <input
          type="text"
          placeholder="Add a comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="flex-1 border-none outline-none text-gray-600"
          disabled={loading} // ✅ Disable input when loading
        />
        <button 
          onClick={handleSubmit} 
          disabled={loading} 
          className={`text-gray-500 text-lg cursor-pointer ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          {loading ? "Sending..." : <FaPaperPlane />}
        </button>
      </div>
      <hr />

      {/* Comments List */}
      <div className="mt-2 space-y-4">
        {comments.length > 0 ? (
          comments.map((comment) => <CommentItem key={comment._id} comment={comment} />)
        ) : (
          <p className="text-center text-gray-500">No comments yet. Be the first! 🎉</p>
        )}
      </div>
    </div>
  );
};

const CommentItem = ({ comment }) => {
  return (
    <div className="flex gap-3 border-b pb-3">
      <img src={getImageUrl(comment.user.image, "https://cdn-icons-png.flaticon.com/512/6596/6596121.png")} alt="User" className="w-10 h-10 rounded-full" />
      <div className="flex-1">
        <p className="text-sm font-semibold">
          {comment.user.firstName} 
          {/* <span className="text-gray-500 text-xs">field to show time</span> */}
        </p>
        <p className="text-gray-800 text-sm">{comment.content}</p>
        <div className="flex gap-3 text-xs text-gray-500 mt-1">
          <button className="flex items-center gap-1 hover:text-red-500">
            <FaHeart /> Like
          </button>
          <button className="flex items-center gap-1 hover:text-blue-500">
            <FaReply /> Reply
          </button>
          <button className="ml-auto hover:text-gray-700">
            <FaEllipsisH />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CommentBox;
