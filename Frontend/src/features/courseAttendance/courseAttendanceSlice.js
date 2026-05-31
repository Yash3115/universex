import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../services/api";

export const fetchCourseAttendance = createAsyncThunk(
  "courseAttendance/fetchCourseAttendance",
  async (courseId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/api/course-attendance/courses/${courseId}/sessions`);
      return { courseId, ...response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const createAttendanceSession = createAsyncThunk(
  "courseAttendance/createAttendanceSession",
  async ({ courseId, payload }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/api/course-attendance/courses/${courseId}/sessions`, payload);
      return { courseId, session: response.data.session };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const fetchAttendanceRecords = createAsyncThunk(
  "courseAttendance/fetchAttendanceRecords",
  async (sessionId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/api/course-attendance/sessions/${sessionId}/records`);
      return { sessionId, records: response.data.records || [] };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const markAttendanceRecords = createAsyncThunk(
  "courseAttendance/markAttendanceRecords",
  async ({ sessionId, records }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/api/course-attendance/sessions/${sessionId}/records`, { records });
      return { sessionId, records: response.data.records || [] };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const updateAttendanceSession = createAsyncThunk(
  "courseAttendance/updateAttendanceSession",
  async ({ courseId, sessionId, payload }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/api/course-attendance/sessions/${sessionId}`, payload);
      return { courseId, session: response.data.session };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

const courseAttendanceSlice = createSlice({
  name: "courseAttendance",
  initialState: {
    sessionsByCourseId: {},
    recordsBySessionId: {},
    myRecordsByCourseId: {},
    myStatsByCourseId: {},
    viewerContextByCourseId: {},
    statusByCourseId: {},
    actionStatus: "idle",
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCourseAttendance.pending, (state, action) => {
        state.statusByCourseId[action.meta.arg] = "loading";
      })
      .addCase(fetchCourseAttendance.fulfilled, (state, action) => {
        state.statusByCourseId[action.payload.courseId] = "succeeded";
        state.sessionsByCourseId[action.payload.courseId] = action.payload.sessions || [];
        state.myRecordsByCourseId[action.payload.courseId] = action.payload.myRecords || [];
        state.myStatsByCourseId[action.payload.courseId] = action.payload.myStats || {};
        state.viewerContextByCourseId[action.payload.courseId] = action.payload.viewerContext || {};
      })
      .addCase(fetchCourseAttendance.rejected, (state, action) => {
        state.statusByCourseId[action.meta.arg] = "failed";
        state.error = action.payload || action.error.message;
      })
      .addCase(createAttendanceSession.fulfilled, (state, action) => {
        state.sessionsByCourseId[action.payload.courseId] = [action.payload.session, ...(state.sessionsByCourseId[action.payload.courseId] || [])];
      })
      .addCase(updateAttendanceSession.fulfilled, (state, action) => {
        state.sessionsByCourseId[action.payload.courseId] = (state.sessionsByCourseId[action.payload.courseId] || []).map((session) => session._id === action.payload.session._id ? action.payload.session : session);
      })
      .addCase(fetchAttendanceRecords.fulfilled, (state, action) => {
        state.recordsBySessionId[action.payload.sessionId] = action.payload.records;
      })
      .addCase(markAttendanceRecords.pending, (state) => {
        state.actionStatus = "loading";
      })
      .addCase(markAttendanceRecords.fulfilled, (state, action) => {
        state.actionStatus = "succeeded";
        state.recordsBySessionId[action.payload.sessionId] = action.payload.records;
      })
      .addCase(markAttendanceRecords.rejected, (state, action) => {
        state.actionStatus = "failed";
        state.error = action.payload || action.error.message;
      });
  },
});

export default courseAttendanceSlice.reducer;