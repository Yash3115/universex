import { useEffect, useState } from "react";
import { fetchPosts } from "../features/posts/postsSlice";
import { useDispatch, useSelector } from "react-redux";
import PostCard from "../components/PostCard";
import CommunitySideBar from "../components/CommunitySideBar";
import CreatePost from "../components/CreatePost";

const Community = () => {
  const dispatch = useDispatch();
  const posts = useSelector((state) => state.posts.posts);
  const postsStatus = useSelector((state) => state.posts.status);
  const error = useSelector((state) => state.posts.error);
  const [createPostIsOpen, setCreatePostIsOpen] = useState(false);

  useEffect(() => {
    if (postsStatus === "idle") {
      dispatch(fetchPosts());
    }
  }, [postsStatus, dispatch]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 lg:flex-row">
      <main className="w-full flex-1 space-y-5">
        <section className="rounded-[2rem] bg-gradient-to-r from-blue-700 to-indigo-700 p-6 text-white shadow-2xl shadow-blue-200">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-100">Campus community</p>
          <h1 className="mt-2 text-3xl font-black sm:text-4xl">Share, discuss, and discover</h1>
          <p className="mt-3 max-w-2xl text-blue-100">Ask questions, post updates, and connect with your college network.</p>
          <button
            onClick={() => setCreatePostIsOpen(true)}
            className="btn mt-5 rounded-2xl border-none bg-white text-blue-700 hover:bg-blue-50"
          >
            + Create new post
          </button>
        </section>

        {postsStatus === "loading" && <p className="rounded-3xl bg-white p-8 text-center font-semibold text-gray-500 shadow">Loading posts...</p>}
        {postsStatus === "failed" && <p className="rounded-3xl bg-red-50 p-8 text-center font-semibold text-red-600">Error: {error}</p>}
        {postsStatus === "succeeded" && posts.length > 0 ? (
          <div className="space-y-5">
            {posts.map((post) => <PostCard key={post._id} post={post} />)}
          </div>
        ) : (
          postsStatus === "succeeded" && <p className="rounded-3xl bg-white p-8 text-center text-gray-500 shadow">No posts available</p>
        )}
      </main>
      <CommunitySideBar />
      </div>

      {createPostIsOpen && <CreatePost onClose={() => setCreatePostIsOpen(false)} />}
    </div>
  );
};

export default Community;
