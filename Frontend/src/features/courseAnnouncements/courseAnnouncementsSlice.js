import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../services/api";

const buildQuery = (filters = {}) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.append(key, value);
  });
  const query = params.toString();
  return query ? `?${query}` : "";
};

export const fetchCourseAnnouncements = createAsyncThunk(
  "courseAnnouncements/fetchCourseAnnouncements",
  async ({ courseId, filters }, { rejectWithValue }) => {
    try {
      const response = await api.get(`/api/courses/${courseId}/announcements${buildQuery(filters)}`);
      return { courseId, announcements: response.data.announcements || [], viewerContext: response.data.viewerContext || {} };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const createCourseAnnouncement = createAsyncThunk(
  "courseAnnouncements/createCourseAnnouncement",
  async ({ courseId, payload }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/api/courses/${courseId}/announcements`, payload);
      return { courseId, announcement: response.data.announcement };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const deleteCourseAnnouncement = createAsyncThunk(
  "courseAnnouncements/deleteCourseAnnouncement",
  async ({ courseId, announcementId }, { rejectWithValue }) => {
    try {
      await api.delete(`/api/courses/${courseId}/announcements/${announcementId}`);
      return { courseId, announcementId };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

const courseAnnouncementsSlice = createSlice({
  name: "courseAnnouncements",
  initialState: {
    itemsByCourseId: {},
    statusByCourseId: {},
    viewerContextByCourseId: {},
    filtersByCourseId: {},
    createStatus: "idle",
    actionLoadingById: {},
    error: null,
  },
  reducers: {
    setAnnouncementFilters: (state, action) => {
      const { courseId, filters } = action.payload;
      state.filtersByCourseId[courseId] = { ...(state.filtersByCourseId[courseId] || {}), ...filters };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCourseAnnouncements.pending, (state, action) => {
        state.statusByCourseId[action.meta.arg.courseId] = "loading";
        state.error = null;
      })
      .addCase(fetchCourseAnnouncements.fulfilled, (state, action) => {
        state.statusByCourseId[action.payload.courseId] = "succeeded";
        state.itemsByCourseId[action.payload.courseId] = action.payload.announcements;
        state.viewerContextByCourseId[action.payload.courseId] = action.payload.viewerContext;
      })
      .addCase(fetchCourseAnnouncements.rejected, (state, action) => {
        state.statusByCourseId[action.meta.arg.courseId] = "failed";
        state.error = action.payload || action.error.message;
      })
      .addCase(createCourseAnnouncement.pending, (state) => {
        state.createStatus = "loading";
      })
      .addCase(createCourseAnnouncement.fulfilled, (state, action) => {
        state.createStatus = "succeeded";
        const list = state.itemsByCourseId[action.payload.courseId] || [];
        state.itemsByCourseId[action.payload.courseId] = [action.payload.announcement, ...list];
      })
      .addCase(createCourseAnnouncement.rejected, (state, action) => {
        state.createStatus = "failed";
        state.error = action.payload || action.error.message;
      })
      .addCase(deleteCourseAnnouncement.pending, (state, action) => {
        state.actionLoadingById[action.meta.arg.announcementId] = true;
      })
      .addCase(deleteCourseAnnouncement.fulfilled, (state, action) => {
        delete state.actionLoadingById[action.payload.announcementId];
        state.itemsByCourseId[action.payload.courseId] = (state.itemsByCourseId[action.payload.courseId] || []).filter(
          (announcement) => announcement._id !== action.payload.announcementId
        );
      })
      .addCase(deleteCourseAnnouncement.rejected, (state, action) => {
        delete state.actionLoadingById[action.meta.arg?.announcementId];
        state.error = action.payload || action.error.message;
      });
  },
});

export const { setAnnouncementFilters } = courseAnnouncementsSlice.actions;
export default courseAnnouncementsSlice.reducer;