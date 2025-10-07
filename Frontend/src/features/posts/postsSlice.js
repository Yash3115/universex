import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const API_URL = "http://localhost:8000/api/posts"; // Update this to the correct backend URL

// Fetch all posts
export const fetchPosts = createAsyncThunk("posts/fetchPosts", async (_, { getState }) => {
  const response = await axios.get(API_URL);
  const posts = response.data.posts;
  const { auth } = getState();
  const userId = auth.user._id; // Ensure _id is used for MongoDB consistency
  return { posts, userId };
});

// Add a new post
export const createPost = createAsyncThunk("posts/createPost", async (postData, { getState }) => {
  const { user } = getState().auth;
  const response = await axios.post(API_URL, {
    ...postData,
    userId: user._id, // Use _id for consistency
  });
  return response.data;
});

// Update a post (only if owned by the current user)
export const updatePost = createAsyncThunk("posts/updatePost", async (postData, { getState }) => {
  const { user } = getState().auth;
  const response = await axios.put(`${API_URL}/${postData._id}`, postData); // Use _id
  return response.data;
});

// Delete a post (only if owned by the current user)
export const deletePost = createAsyncThunk(
  "posts/deletePost",
  async (postId) => {
    await axios.delete(`${API_URL}/${postId}`, {
      withCredentials: true, // Ensure cookies are sent with the request
    });
    return postId;
  }
);


const initialState = {
  posts: [], // All posts (including others' posts)
  userPosts: [], // Posts created by the current user
  status: "idle", // loading, succeeded, failed
  error: null,
};

const postsSlice = createSlice({
  name: "posts",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPosts.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchPosts.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.posts = action.payload.posts;
        const userId = action.payload.userId;
        state.userPosts = state.posts.filter((post) => post.user._id === userId);
      })
      .addCase(fetchPosts.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message;
      })
      .addCase(createPost.fulfilled, (state, action) => {
        state.posts.unshift(action.payload);
        state.userPosts.unshift(action.payload);
      })
      .addCase(updatePost.fulfilled, (state, action) => {
        state.posts = state.posts.map((post) => 
          post._id === action.payload._id ? action.payload : post
        );
        state.userPosts = state.userPosts.map((post) => 
          post._id === action.payload._id ? action.payload : post
        );
      })
      .addCase(deletePost.fulfilled, (state, action) => {
        state.posts = state.posts.filter((post) => post._id !== action.payload);
        state.userPosts = state.userPosts.filter((post) => post._id !== action.payload);
      });
  },
});

export default postsSlice.reducer;
