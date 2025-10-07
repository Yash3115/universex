import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { toast } from "react-toastify";

// LOGIN
export const login = createAsyncThunk(
  "auth/login",
  async (data, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        "http://localhost:8000/api/users/login",
        data,
        {
          withCredentials: true,
          headers: { "Content-Type": "application/json" },
        }
      );
      return response.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Login failed");
      return rejectWithValue(error.response?.data);
    }
  }
);

// GET USER (Check if user is logged in)
export const getUser = createAsyncThunk(
  "auth/getUser",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        "http://localhost:8000/api/users/getUser",
        {
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  }
);

// LOGOUT
export const logout = createAsyncThunk(
  "auth/logout",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        "http://localhost:8000/api/users/logout",
        {
          withCredentials: true,
        }
      );
      toast.success(response.data.message);
      return response.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Logout failed");
      return rejectWithValue(error.response?.data);
    }
  }
);

export const updateProfileImage = createAsyncThunk(
  "auth/updateProfileImage",
  async (formData, { rejectWithValue }) => {
    try {
      const response = await axios.put(
        "http://localhost:8000/api/profile/updateDisplayPicture",
        formData,
        {
          withCredentials: true,
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      toast.success("Profile picture updated successfully!");
      return response.data;
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to update profile picture"
      );
      return rejectWithValue(error.response?.data);
    }
  }
);

export const updateProfile = createAsyncThunk(
  "auth/updateProfile",
  async (data, { rejectWithValue }) => {
    try {
      const response = await axios.put(
        "http://localhost:8000/api/profile/updateProfile",
        data,
        {
          withCredentials: true,
          headers: { "Content-Type": "application/json" },
        }
      );
      console.log(response.data)
      {response.data.success ? 
        toast.success(response.data.message):
        toast.error(response.data.message)
      }
      return response.data;

    } catch (error) {
      toast.error(error.response?.data?.message || "Update Failed");
      return rejectWithValue(error.response?.data);
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState: {
    loading: true,
    isAuthenticated: false,
    user: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
      })
      .addCase(login.rejected, (state) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
      })
      .addCase(getUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(getUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        console.log(action.payload.user);
      })
      .addCase(getUser.rejected, (state) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
      })
      .addCase(logout.fulfilled, (state) => {
        state.isAuthenticated = false;
        state.user = null;
      })
      .addCase(updateProfileImage.pending, (state) => {
        state.error = null;
      })
      .addCase(updateProfileImage.fulfilled, (state, action) => {
        if (state.user) {
          state.user.image = action.payload.data.image;
        }
      })
      .addCase(updateProfileImage.rejected, (state, action) => {
        state.error =
          action.payload?.message || "Failed to update profile image";
      })
      .addCase(updateProfile.pending, (state) => {
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        if (state.user) {
          state.user.additionalDetails = action.payload.data;
        }
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.error = action.payload || "Something went wrong";
      });
  },
});

export default authSlice.reducer;
