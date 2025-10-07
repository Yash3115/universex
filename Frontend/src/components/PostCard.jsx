import React, { useState, useEffect } from "react";
import { FaRegComment, FaThumbsUp, FaFlag, FaEdit, FaTrash } from "react-icons/fa";
import CommentBox from "./CommentBox";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { deletePost } from "../features/posts/postsSlice";

const PostCard = ({ post, allowUpdate = false }) => {
  const user = useSelector((state) => state.auth.user);
  const [showComment, setShowComment] = useState(false);
  const [openReportBox, setOpenReportBox] = useState(false);
  const [likes, setLikes] = useState(post?.likes?.length || 0);
  const [isLiked, setIsLiked] = useState(false);
  const dispatch = useDispatch();

  useEffect(() => {
    setIsLiked(post?.likes?.includes(user?._id));
  }, [post?.likes, user?._id]);

  const handleLike = async () => {
    if (!user) {
      alert("You need to log in to like posts!");
      return;
    }

    try {
      const { data } = await axios.put(
        `https://universex-m5nn.vercel.app/api/posts/${post?._id}/like`,
        {},
        {
          withCredentials: true,
          headers: { "Content-Type": "application/json" },
        }
      );

      setLikes((prevLikes) => (isLiked ? prevLikes - 1 : prevLikes + 1));
      setIsLiked((prevIsLiked) => !prevIsLiked);
    } catch (error) {
      console.error(
        "Error liking post:",
        error.response?.data || error.message
      );
    }
  };

  const handleEdit = () => {
    console.log("Edit Post", post?._id);
    // Add edit post logic here
  };

  const handleDelete = async () => {
    console.log("Delete Post", post?._id);
    console.log(post?._id);
    
    dispatch(deletePost(post?._id))
    // Add delete post logic here
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
            onClick={handleDelete}
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
                onClick={() => console.log("Post reported!")}
                className="btn bg-red-500 text-white px-4 py-2 rounded-lg ml-2"
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}

      {showComment && <CommentBox postId={post?._id} />}
    </div>
  );
};

export default PostCard;
