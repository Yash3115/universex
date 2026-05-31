import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../services/api";

const COURSES_ENDPOINT = "/api/courses";

const buildQuery = (filters = {}) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.append(key, value);
  });
  const query = params.toString();
  return query ? `?${query}` : "";
};

export const fetchMyCourses = createAsyncThunk(
  "courses/fetchMyCourses",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(`${COURSES_ENDPOINT}/mine`);
      return response.data.courses || [];
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const discoverCourses = createAsyncThunk(
  "courses/discoverCourses",
  async (filters, { rejectWithValue }) => {
    try {
      const response = await api.get(`${COURSES_ENDPOINT}/discover${buildQuery(filters)}`);
      return response.data.courses || [];
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const fetchCourseById = createAsyncThunk(
  "courses/fetchCourseById",
  async (courseId, { rejectWithValue }) => {
    try {
      const response = await api.get(`${COURSES_ENDPOINT}/${courseId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const createCourse = createAsyncThunk(
  "courses/createCourse",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await api.post(COURSES_ENDPOINT, payload);
      return response.data.course;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const joinCourse = createAsyncThunk(
  "courses/joinCourse",
  async ({ courseId, joinCode }, { rejectWithValue }) => {
    try {
      const response = await api.post(`${COURSES_ENDPOINT}/${courseId}/join`, { joinCode });
      return response.data.course;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const updateEnrollment = createAsyncThunk(
  "courses/updateEnrollment",
  async ({ courseId, studentId, status }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`${COURSES_ENDPOINT}/${courseId}/enrollments/${studentId}`, { status });
      return response.data.course;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

const coursesSlice = createSlice({
  name: "courses",
  initialState: {
    myCourses: [],
    discoveredCourses: [],
    selectedCourse: null,
    viewerContext: null,
    filters: { search: "", department: "" },
    status: "idle",
    discoverStatus: "idle",
    selectedStatus: "idle",
    actionStatus: "idle",
    error: null,
  },
  reducers: {
    setCourseFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearSelectedCourse: (state) => {
      state.selectedCourse = null;
      state.viewerContext = null;
      state.selectedStatus = "idle";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyCourses.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchMyCourses.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.myCourses = action.payload;
      })
      .addCase(fetchMyCourses.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || action.error.message;
      })
      .addCase(discoverCourses.pending, (state) => {
        state.discoverStatus = "loading";
      })
      .addCase(discoverCourses.fulfilled, (state, action) => {
        state.discoverStatus = "succeeded";
        state.discoveredCourses = action.payload;
      })
      .addCase(discoverCourses.rejected, (state, action) => {
        state.discoverStatus = "failed";
        state.error = action.payload || action.error.message;
      })
      .addCase(fetchCourseById.pending, (state) => {
        state.selectedStatus = "loading";
      })
      .addCase(fetchCourseById.fulfilled, (state, action) => {
        state.selectedStatus = "succeeded";
        state.selectedCourse = action.payload.course;
        state.viewerContext = action.payload.viewerContext;
      })
      .addCase(fetchCourseById.rejected, (state, action) => {
        state.selectedStatus = "failed";
        state.error = action.payload || action.error.message;
      })
      .addCase(createCourse.pending, (state) => {
        state.actionStatus = "loading";
      })
      .addCase(createCourse.fulfilled, (state, action) => {
        state.actionStatus = "succeeded";
        state.myCourses.unshift(action.payload);
      })
      .addCase(createCourse.rejected, (state, action) => {
        state.actionStatus = "failed";
        state.error = action.payload || action.error.message;
      })
      .addCase(joinCourse.fulfilled, (state, action) => {
        state.discoveredCourses = state.discoveredCourses.map((course) => course._id === action.payload._id ? action.payload : course);
        state.myCourses = [action.payload, ...state.myCourses.filter((course) => course._id !== action.payload._id)];
      })
      .addCase(updateEnrollment.fulfilled, (state, action) => {
        state.selectedCourse = action.payload;
        state.myCourses = state.myCourses.map((course) => course._id === action.payload._id ? action.payload : course);
      });
  },
});

export const { clearSelectedCourse, setCourseFilters } = coursesSlice.actions;
export default coursesSlice.reducer;