import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../services/api";

const ACADEMIC_ENDPOINT = "/api/academic";

export const fetchAcademicOverview = createAsyncThunk(
  "academic/fetchOverview",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(`${ACADEMIC_ENDPOINT}/overview`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const saveRoutine = createAsyncThunk(
  "academic/saveRoutine",
  async (entries, { rejectWithValue }) => {
    try {
      const response = await api.put(`${ACADEMIC_ENDPOINT}/routine`, { entries });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const markAttendance = createAsyncThunk(
  "academic/markAttendance",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await api.post(`${ACADEMIC_ENDPOINT}/attendance`, payload);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const deleteAttendance = createAsyncThunk(
  "academic/deleteAttendance",
  async (attendanceId, { rejectWithValue }) => {
    try {
      const response = await api.delete(`${ACADEMIC_ENDPOINT}/attendance/${attendanceId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const createAcademicTask = createAsyncThunk(
  "academic/createTask",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await api.post(`${ACADEMIC_ENDPOINT}/tasks`, payload);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const updateAcademicTask = createAsyncThunk(
  "academic/updateTask",
  async ({ taskId, payload }, { rejectWithValue }) => {
    try {
      const response = await api.put(`${ACADEMIC_ENDPOINT}/tasks/${taskId}`, payload);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const deleteAcademicTask = createAsyncThunk(
  "academic/deleteTask",
  async (taskId, { rejectWithValue }) => {
    try {
      const response = await api.delete(`${ACADEMIC_ENDPOINT}/tasks/${taskId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

const initialState = {
  routine: [],
  attendance: [],
  attendanceStats: [],
  tasks: [],
  status: "idle",
  error: null,
};

const academicSlice = createSlice({
  name: "academic",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAcademicOverview.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchAcademicOverview.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.routine = action.payload.routine || [];
        state.attendance = action.payload.attendance || [];
        state.attendanceStats = action.payload.attendanceStats || [];
        state.tasks = action.payload.tasks || [];
      })
      .addCase(fetchAcademicOverview.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || action.error.message;
      })
      .addCase(saveRoutine.fulfilled, (state, action) => {
        state.routine = action.payload.routine || [];
      })
      .addCase(markAttendance.fulfilled, (state, action) => {
        state.attendance = action.payload.attendanceRecords || state.attendance;
        state.attendanceStats = action.payload.attendanceStats || state.attendanceStats;
      })
      .addCase(deleteAttendance.fulfilled, (state, action) => {
        state.attendance = action.payload.attendanceRecords || state.attendance;
        state.attendanceStats = action.payload.attendanceStats || state.attendanceStats;
      })
      .addCase(createAcademicTask.fulfilled, (state, action) => {
        state.tasks.unshift(action.payload.task);
      })
      .addCase(updateAcademicTask.fulfilled, (state, action) => {
        state.tasks = state.tasks.map((task) =>
          task._id === action.payload.task._id ? action.payload.task : task
        );
      })
      .addCase(deleteAcademicTask.fulfilled, (state, action) => {
        state.tasks = state.tasks.filter((task) => task._id !== action.payload.taskId);
      });
  },
});

export default academicSlice.reducer;