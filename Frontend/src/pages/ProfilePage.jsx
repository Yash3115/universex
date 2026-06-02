import { useEffect } from "react";
import { fetchPosts } from "../features/posts/postsSlice";
import { FaInstagram, FaLinkedin, FaPhone } from "react-icons/fa";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import PostCard from "../components/PostCard";
import { getImageUrl } from "../utils/imageUtils";

const ProfilePage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const userPosts = useSelector((state) => state.posts.userPosts);
  const postStatus = useSelector((state) => state.posts.status);
  const error = useSelector((state) => state.posts.error);

  useEffect(() => {
    if (postStatus === "idle") {
      dispatch(fetchPosts());
    }
  }, [dispatch, postStatus]); // Fetch only if posts are not already loaded

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
        <div className="mx-auto max-w-5xl rounded-3xl bg-white p-8 text-center shadow-xl">
          <p className="font-semibold text-gray-500">Loading profile...</p>
        </div>
      </div>
    );
  }

  const details = user.additionalDetails || {};

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex w-full flex-col items-center gap-6 rounded-[2rem] bg-white p-6 text-center shadow-2xl shadow-slate-200/70 sm:flex-row sm:text-left">
        <div className="avatar">
          <div className="h-28 w-28 overflow-hidden rounded-full border-4 border-blue-100 shadow-lg md:h-32 md:w-32">
            <img
              src={getImageUrl(user.image, "https://cdn-icons-png.flaticon.com/512/6596/6596121.png")}
              alt="Profile"
              className="object-cover w-full h-full"
            />
          </div>
        </div>

        {/* User Details */}
        <div className="flex flex-col items-start text-left">
          <h2 className="text-2xl font-bold">
            {user.firstName} {user.lastName}
          </h2>
          <p className="mt-1 text-gray-600">{details.about || "No bio added yet."}</p>

          {/* Social Links & Contact */}
          <div className="flex flex-wrap justify-start gap-4 mt-4">
            {details.insta && (
              <a
                href={details.insta}
                target="_blank"
                rel="noopener noreferrer"
                className="text-pink-500 flex items-center gap-2 hover:underline"
              >
                <FaInstagram />
                Instagram
              </a>
            )}
            {details.linkedin && (
              <a
                href={details.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 flex items-center gap-2 hover:underline"
              >
                <FaLinkedin />
                LinkedIn
              </a>
            )}
            {details.contactNumber && (
              <p className="text-gray-800 flex items-center gap-2">
                <FaPhone />
                {details.contactNumber}
              </p>
            )}
          </div>
        </div>
        <button className="btn btn-primary rounded-2xl sm:ml-auto" onClick={() => navigate("/profileEdit")}>
          Edit profile
        </button>
      </div>

      {/* Posts Section */}
      <div className="rounded-[2rem] bg-white p-5 shadow-xl shadow-slate-200/70">
        <h3 className="mb-4 text-xl font-black text-gray-900">Your Posts</h3>
        <main className="w-full">
          {/* Loading & Error States */}
          {postStatus === "loading" && (
            <p className="text-center text-gray-500">Loading posts...</p>
          )}
          {postStatus === "failed" && (
            <p className="text-red-500 text-center">Error: {error}</p>
          )}

          {/* Display Posts */}
          {postStatus === "succeeded" && userPosts.length > 0 ? (
            <div className="flex flex-col gap-6">
              {userPosts.map((post) => (
                <PostCard key={post._id} post={post} allowUpdate={true} />
              ))}
            </div>
          ) : (
            postStatus === "succeeded" && <p className="rounded-2xl bg-gray-50 p-6 text-center text-gray-500">No posts available</p>
          )}
        </main>
      </div>
      </div>
    </div>
  );
};

export default ProfilePage;
