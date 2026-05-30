import { useState, useEffect } from "react";
import { FaRegComment, FaThumbsUp, FaFlag, FaTrash } from "react-icons/fa";
import CommentBox from "./CommentBox";
import api from "../services/api";
import { useDispatch, useSelector } from "react-redux";
import { deletePost } from "../features/posts/postsSlice";
import { toast } from "react-toastify";
import ConfirmDialog from "./ConfirmDialog";

const PostCard = ({ post, allowUpdate = false }) => {
  const user = useSelector((state) => state.auth.user);
  const [showComment, setShowComment] = useState(false);
  const [openReportBox, setOpenReportBox] = useState(false);
  const [likes, setLikes] = useState(post?.likes?.length || 0);
  const [isLiked, setIsLiked] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const dispatch = useDispatch();

  useEffect(() => {
    setLikes(post?.likes?.length || 0);
    setIsLiked(post?.likes?.some((id) => String(id) === String(user?._id)) || false);
  }, [post?.likes, user?._id]);

  const handleLike = async () => {
    if (!user) {
      toast.info("Please log in to like posts.");
      return;
    }

    try {
      const { data } = await api.put(`/api/posts/${post?._id}/like`);

      setLikes(data.likesCount ?? data.post?.likes?.length ?? likes);
      setIsLiked(data.post?.likes?.some((id) => String(id) === String(user?._id)) ?? !isLiked);
    } catch (error) {
      console.error(
        "Error liking post:",
        error.response?.data || error.message
      );
    }
  };

  const handleDelete = async () => {
    if (!post?._id) return;

    try {
      await dispatch(deletePost(post._id)).unwrap();
      setDeleteDialogOpen(false);
      toast.success("Post deleted successfully");
    } catch (error) {
      toast.error(error || "Failed to delete post");
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md relative">
      {/* Edit & Delete Icons (Only If allowUpdate is true) */}
      {allowUpdate && (
        <div className="absolute top-2 right-4 flex space-x-3 text-gray-500">
          {/* <button
            onClick={handleEdit}
            className="hover:text-blue-600 transition-colors duration-200"
          >
            <FaEdit size={18} />
          </button> */}
          <button
            onClick={() => setDeleteDialogOpen(true)}
            className="hover:text-red-600 transition-colors duration-200"
          >
            <FaTrash size={18} />
          </button>
        </div>
      )}

      {/* User Info */}
      <div className="flex items-center">
        <img
          src={
            post?.user?.image ||
            "https://cdn-icons-png.flaticon.com/512/6596/6596121.png"
          }
          alt="Profile Pic"
          className="w-12 h-12 rounded-full object-cover border border-gray-300"
        />
        <div className="ml-3">
          <h3 className="text-lg font-semibold">
            {post?.user?.firstName || "UserName"}
          </h3>
        </div>
      </div>

      {/* Post Content */}
      <div className="mt-3 space-y-3">
        <p className="text-gray-800 text-base leading-relaxed">
          {post?.content || ""}
        </p>

        {post?.image && (
          <div className="relative flex justify-center">
            {/* Blurred Background */}
            <div
              className="absolute inset-0 bg-cover bg-center blur-sm rounded-lg"
              style={{
                backgroundImage: `url(${post.image})`,
                filter: "blur(5px)",
                opacity: 0.5,
              }}
            ></div>

            {/* Main Image */}
            <img
              src={post.image}
              alt="Post Content"
              className="relative w-full max-w-lg h-auto max-h-80 object-contain"
            />
          </div>
        )}
      </div>

      {/* Like, Comment, Report */}
      <div className="flex justify-between items-center mt-4 text-gray-600">
        <button
          className={`flex items-center space-x-2 transition-colors duration-300 ${
            isLiked ? "text-blue-600" : "text-gray-600"
          }`}
          onClick={handleLike}
        >
          <FaThumbsUp />
          <span>{likes}</span>
        </button>
        <button
          className="flex items-center space-x-2 hover:text-blue-600"
          onClick={() => setShowComment(!showComment)}
        >
          <FaRegComment /> <span>Comment {post?.comments?.length || 0}</span>
        </button>
        <button
          className="flex items-center space-x-2 hover:text-blue-600"
          onClick={() => setOpenReportBox(true)}
        >
          <FaFlag /> <span>Report</span>
        </button>
      </div>

      {/* Report Modal */}
      {openReportBox && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="modal-box bg-white text-blue-700 border border-blue-300 shadow-lg p-4 rounded-lg">
            <h2 className="text-xl font-bold">Confirm Report</h2>
            <p className="text-blue-600">
              Are you sure you want to report this post?
            </p>
            <div className="modal-action flex justify-end mt-4">
              <button
                onClick={() => setOpenReportBox(false)}
                className="btn bg-gray-300 text-black px-4 py-2 rounded-lg"
              >
                No
              </button>
              <button
                onClick={() => {
                  toast.info("Thanks for reporting. Moderation workflow is pending.");
                  setOpenReportBox(false);
                }}
                className="btn bg-red-500 text-white px-4 py-2 rounded-lg ml-2"
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}

      {showComment && <CommentBox postId={post?._id} />}
      <ConfirmDialog
        open={deleteDialogOpen}
        title="Delete this post?"
        message="This will permanently remove the post and its comments. This action cannot be undone."
        confirmText="Delete post"
        variant="danger"
        onCancel={() => setDeleteDialogOpen(false)}
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default PostCard;
