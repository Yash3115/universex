import { useEffect } from "react";
import { fetchPosts } from "../features/posts/postsSlice";
import { FaInstagram, FaLinkedin, FaPhone } from "react-icons/fa";
import { useSelector, useDispatch } from "react-redux";
import PostCard from "../components/PostCard";

const ProfilePage = () => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const userPosts = useSelector((state) => state.posts.userPosts);
  const postStatus = useSelector((state) => state.posts.status);
  const error = useSelector((state) => state.posts.error);

  useEffect(() => {
    if (postStatus === "idle") {
      dispatch(fetchPosts());
    }
  }, [dispatch, postStatus]); // Fetch only if posts are not already loaded

  return (
    <div className="max-w-5xl mx-auto p-6">
      {/* Profile Section */}
      <div className="flex w-full items-start gap-6 border-b pb-6">
        {/* Profile Image */}
        <div className="avatar">
          <div className="md:w-32 w-24 rounded-full overflow-hidden border-2 border-gray-300">
            <img
              src={user.image}
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
          <p className="text-gray-600 mt-1">{user.additionalDetails.about}</p>

          {/* Social Links & Contact */}
          <div className="flex flex-wrap justify-start gap-4 mt-4">
            {user.additionalDetails.insta && (
              <a
                href={user.additionalDetails.insta}
                target="_blank"
                rel="noopener noreferrer"
                className="text-pink-500 flex items-center gap-2 hover:underline"
              >
                <FaInstagram />
                Instagram
              </a>
            )}
            {user.additionalDetails.linkedin && (
              <a
                href={user.additionalDetails.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 flex items-center gap-2 hover:underline"
              >
                <FaLinkedin />
                LinkedIn
              </a>
            )}
            {user.additionalDetails.contactNumber && (
              <p className="text-gray-800 flex items-center gap-2">
                <FaPhone />
                {user.additionalDetails.contactNumber}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Posts Section */}
      <div className="mt-6">
        <h3 className="text-xl font-semibold mb-4">Your Posts</h3>
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
            <p className="text-center text-gray-500">No posts available</p>
          )}
        </main>
      </div>
    </div>
  );
};

export default ProfilePage;
