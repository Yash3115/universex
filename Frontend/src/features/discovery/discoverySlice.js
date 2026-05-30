import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../services/api";

const buildQuery = (filters) => {
  const params = new URLSearchParams();
  Object.entries(filters || {}).forEach(([key, value]) => {
    if (value) params.append(key, value);
  });
  const query = params.toString();
  return query ? `?${query}` : "";
};

export const searchStudents = createAsyncThunk(
  "discovery/searchStudents",
  async (filters, { rejectWithValue }) => {
    try {
      const response = await api.get(`/api/discovery/students${buildQuery(filters)}`);
      return response.data.students || [];
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const requestConnection = createAsyncThunk(
  "discovery/requestConnection",
  async (recipientId, { rejectWithValue }) => {
    try {
      const response = await api.post("/api/discovery/connections", { recipientId });
      return { recipientId, connection: response.data.connection };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

const discoverySlice = createSlice({
  name: "discovery",
  initialState: {
    students: [],
    status: "idle",
    error: null,
    filters: { search: "", department: "", college: "", graduationYear: "" },
  },
  reducers: {
    setDiscoveryFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(searchStudents.pending, (state) => {
        state.status = "loading";
      })
      .addCase(searchStudents.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.students = action.payload;
      })
      .addCase(searchStudents.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || action.error.message;
      })
      .addCase(requestConnection.fulfilled, (state, action) => {
        state.students = state.students.map((student) =>
          student._id === action.payload.recipientId ? { ...student, connectionStatus: "pending" } : student
        );
      });
  },
});

export const { setDiscoveryFilters } = discoverySlice.actions;
export default discoverySlice.reducer;