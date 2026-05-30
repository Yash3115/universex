import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api";

const POSTS_ENDPOINT = "/api/posts";

// Fetch all posts
export const fetchPosts = createAsyncThunk(
  "posts/fetchPosts",
  async (_, { getState, rejectWithValue }) => {
    try {
      const response = await api.get(POSTS_ENDPOINT);
      const posts = response.data.posts || [];
      const userId = getState().auth.user?._id || null;
      return { posts, userId };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// Add a new post
export const createPost = createAsyncThunk(
  "posts/createPost",
  async (postData, { rejectWithValue }) => {
    try {
      const isFormData = typeof FormData !== "undefined" && postData instanceof FormData;
      const response = await api.post(POSTS_ENDPOINT, postData, {
        headers: isFormData ? { "Content-Type": "multipart/form-data" } : undefined,
      });
      return response.data.post || response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// Update a post (only if owned by the current user)
export const updatePost = createAsyncThunk(
  "posts/updatePost",
  async (postData, { rejectWithValue }) => {
    try {
      const response = await api.put(`${POSTS_ENDPOINT}/${postData._id}`, postData);
      return response.data.post || response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// Delete a post (only if owned by the current user)
export const deletePost = createAsyncThunk(
  "posts/deletePost",
  async (postId, { rejectWithValue }) => {
    try {
      await api.delete(`${POSTS_ENDPOINT}/${postId}`);
      return postId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
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
        state.userPosts = userId
          ? state.posts.filter((post) => String(post.user?._id) === String(userId))
          : [];
      })
      .addCase(fetchPosts.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || action.error.message;
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
      })
      .addCase(createPost.rejected, (state, action) => {
        state.error = action.payload || action.error.message;
      })
      .addCase(updatePost.rejected, (state, action) => {
        state.error = action.payload || action.error.message;
      })
      .addCase(deletePost.rejected, (state, action) => {
        state.error = action.payload || action.error.message;
      });
  },
});

export default postsSlice.reducer;
