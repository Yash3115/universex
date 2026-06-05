import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api";
import { toast } from "react-toastify";

const DEMO_SESSION_STORAGE_KEY = "universexDemoSession";
const DEMO_SESSION_EXPIRED_KEY = "universexDemoSessionExpired";

const rememberDemoSession = () => {
  window.localStorage.setItem(DEMO_SESSION_STORAGE_KEY, "true");
  window.localStorage.removeItem(DEMO_SESSION_EXPIRED_KEY);
};

const clearDemoSession = () => {
  window.localStorage.removeItem(DEMO_SESSION_STORAGE_KEY);
  window.localStorage.removeItem(DEMO_SESSION_EXPIRED_KEY);
};

const markExpiredDemoSession = () => {
  if (window.localStorage.getItem(DEMO_SESSION_STORAGE_KEY) === "true") {
    window.localStorage.removeItem(DEMO_SESSION_STORAGE_KEY);
    window.localStorage.setItem(DEMO_SESSION_EXPIRED_KEY, "true");
    toast.info("Demo session expired. Start a new demo anytime.");
  }
};

// LOGIN
export const login = createAsyncThunk(
  "auth/login",
  async (data, { rejectWithValue }) => {
    try {
      clearDemoSession();
      const response = await api.post(
        "/api/users/login",
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
      const response = await api.get(
        "/api/users/getUser",
        {
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error) {
      markExpiredDemoSession();
      return rejectWithValue(error.response?.data);
    }
  }
);

// LOGOUT
export const logout = createAsyncThunk(
  "auth/logout",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(
        "/api/users/logout",
        {
          withCredentials: true,
        }
      );
      toast.success(response.data.message);
      clearDemoSession();
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
      const response = await api.put(
        "/api/profile/updateDisplayPicture",
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
      const response = await api.put(
        "/api/profile/updateProfile",
        data,
        {
          withCredentials: true,
          headers: { "Content-Type": "application/json" },
        }
      );
      if (response.data.success) {
        toast.success(response.data.message);
      } else {
        toast.error(response.data.message);
      }
      return response.data;

    } catch (error) {
      toast.error(error.response?.data?.message || "Update Failed");
      return rejectWithValue(error.response?.data);
    }
  }
);

export const startDemoSession = createAsyncThunk(
  "auth/startDemoSession",
  async (role = "Student", { rejectWithValue }) => {
    try {
      const response = await api.post(
        "/api/demo/start",
        { role },
        {
          withCredentials: true,
          headers: { "Content-Type": "application/json" },
        }
      );
      toast.success(response.data.message || "Demo mode started");
      rememberDemoSession();
      return response.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to start demo mode");
      return rejectWithValue(error.response?.data);
    }
  }
);

export const exitDemoSession = createAsyncThunk(
  "auth/exitDemoSession",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.post(
        "/api/demo/exit",
        {},
        {
          withCredentials: true,
          headers: { "Content-Type": "application/json" },
        }
      );
      toast.success(response.data.message || "Demo mode ended");
      clearDemoSession();
      try {
        const sessionResponse = await api.get("/api/users/getUser", { withCredentials: true });
        return { ...response.data, restoredUser: sessionResponse.data.user || null };
      } catch (_error) {
        return { ...response.data, restoredUser: null };
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to exit demo mode");
      return rejectWithValue(error.response?.data);
    }
  }
);

export const submitAccessRequest = createAsyncThunk(
  "auth/submitAccessRequest",
  async (data, { rejectWithValue }) => {
    try {
      const response = await api.post(
        "/api/demo/access-request",
        data,
        {
          withCredentials: true,
          headers: { "Content-Type": "application/json" },
        }
      );
      toast.success(response.data.message || "Access request submitted");
      return response.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to submit access request");
      return rejectWithValue(error.response?.data);
    }
  }
);

export const completeOnboarding = createAsyncThunk(
  "auth/completeOnboarding",
  async (data, { rejectWithValue }) => {
    try {
      const response = await api.post(
        "/api/users/complete-onboarding",
        data,
        {
          withCredentials: true,
          headers: { "Content-Type": "application/json" },
        }
      );
      toast.success(response.data.message || "Welcome setup completed");
      return response.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to complete setup");
      return rejectWithValue(error.response?.data);
    }
  }
);

const mergeSessionUser = (currentUser, nextUser) => {
  if (!nextUser) return currentUser;
  return {
    ...nextUser,
    isDemo: nextUser.isDemo ?? currentUser?.isDemo ?? false,
    demoExpiresAt: nextUser.demoExpiresAt ?? currentUser?.demoExpiresAt ?? null,
  };
};

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
      })
      .addCase(getUser.rejected, (state) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
      })
      .addCase(logout.fulfilled, (state) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
      })
      .addCase(startDemoSession.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(startDemoSession.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = mergeSessionUser(state.user, action.payload.user);
      })
      .addCase(startDemoSession.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Unable to start demo mode";
      })
      .addCase(exitDemoSession.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = Boolean(action.payload?.restoredUser);
        state.user = action.payload?.restoredUser || null;
      })
      .addCase(updateProfileImage.pending, (state) => {
        state.error = null;
      })
      .addCase(updateProfileImage.fulfilled, (state, action) => {
        state.user = mergeSessionUser(state.user, action.payload.data);
      })
      .addCase(updateProfileImage.rejected, (state, action) => {
        state.error =
          action.payload?.message || "Failed to update profile image";
      })
      .addCase(updateProfile.pending, (state) => {
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.user = mergeSessionUser(state.user, action.payload.user || action.payload.updatedUserDetails);
        if (state.user && action.payload.data) {
          state.user.additionalDetails = action.payload.data;
        }
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.error = action.payload || "Something went wrong";
      })
      .addCase(completeOnboarding.pending, (state) => {
        state.error = null;
      })
      .addCase(completeOnboarding.fulfilled, (state, action) => {
        state.user = action.payload.user || state.user;
        state.isAuthenticated = true;
        state.loading = false;
      })
      .addCase(completeOnboarding.rejected, (state, action) => {
        state.error = action.payload || "Unable to complete setup";
      });
  },
});

export default authSlice.reducer;
