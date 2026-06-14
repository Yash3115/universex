import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../services/api";

const JOBS_ENDPOINT = "/api/jobposting";

const buildQueryString = (filters = {}) => {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      params.append(key, value);
    }
  });

  const queryString = params.toString();
  return queryString ? `?${queryString}` : "";
};

export const fetchJobs = createAsyncThunk(
  "jobs/fetchJobs",
  async (filters, { rejectWithValue }) => {
    try {
      const response = await api.get(`${JOBS_ENDPOINT}${buildQueryString(filters)}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const createJob = createAsyncThunk(
  "jobs/createJob",
  async (jobData, { rejectWithValue }) => {
    try {
      const response = await api.post(JOBS_ENDPOINT, jobData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const updateJob = createAsyncThunk(
  "jobs/updateJob",
  async ({ jobId, jobData }, { rejectWithValue }) => {
    try {
      const response = await api.put(`${JOBS_ENDPOINT}/${jobId}`, jobData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const deleteJob = createAsyncThunk(
  "jobs/deleteJob",
  async (jobId, { rejectWithValue }) => {
    try {
      await api.delete(`${JOBS_ENDPOINT}/${jobId}`);
      return jobId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const toggleSavedJob = createAsyncThunk(
  "jobs/toggleSavedJob",
  async (jobId, { rejectWithValue }) => {
    try {
      const response = await api.put(`${JOBS_ENDPOINT}/${jobId}/save`);
      return response.data.job;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const toggleInterestedJob = createAsyncThunk(
  "jobs/toggleInterestedJob",
  async (jobId, { rejectWithValue }) => {
    try {
      const response = await api.put(`${JOBS_ENDPOINT}/${jobId}/interest`);
      return response.data.job;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

const replaceJob = (jobs, updatedJob) =>
  jobs.map((job) => (job._id === updatedJob._id ? updatedJob : job));

const initialState = {
  jobs: [],
  status: "idle",
  error: null,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalJobs: 0,
  },
  filters: {
    search: "",
    status: "open",
    opportunityType: "all",
    jobType: "all",
    sort: "deadline",
  },
};

const jobsSlice = createSlice({
  name: "jobs",
  initialState,
  reducers: {
    setJobFilters: (state, action) => {
      state.filters = {
        ...state.filters,
        ...action.payload,
      };
    },
    resetJobFilters: (state) => {
      state.filters = initialState.filters;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchJobs.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchJobs.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.jobs = action.payload.jobs || [];
        state.pagination = action.payload.pagination || initialState.pagination;
      })
      .addCase(fetchJobs.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || action.error.message;
      })
      .addCase(createJob.fulfilled, (state, action) => {
        state.jobs.unshift(action.payload.job);
        state.pagination.totalJobs += 1;
      })
      .addCase(updateJob.fulfilled, (state, action) => {
        state.jobs = replaceJob(state.jobs, action.payload.job);
      })
      .addCase(deleteJob.fulfilled, (state, action) => {
        state.jobs = state.jobs.filter((job) => job._id !== action.payload);
        state.pagination.totalJobs = Math.max(0, state.pagination.totalJobs - 1);
      })
      .addCase(createJob.rejected, (state, action) => {
        state.error = action.payload || action.error.message;
      })
      .addCase(updateJob.rejected, (state, action) => {
        state.error = action.payload || action.error.message;
      })
      .addCase(deleteJob.rejected, (state, action) => {
        state.error = action.payload || action.error.message;
      })
      .addCase(toggleSavedJob.fulfilled, (state, action) => {
        state.jobs = replaceJob(state.jobs, action.payload);
      })
      .addCase(toggleInterestedJob.fulfilled, (state, action) => {
        state.jobs = replaceJob(state.jobs, action.payload);
      })
      .addCase(toggleSavedJob.rejected, (state, action) => {
        state.error = action.payload || action.error.message;
      })
      .addCase(toggleInterestedJob.rejected, (state, action) => {
        state.error = action.payload || action.error.message;
      });
  },
});

export const { setJobFilters, resetJobFilters } = jobsSlice.actions;
export default jobsSlice.reducer;
