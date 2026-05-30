import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../services/api";

export const fetchBudgetAnalytics = createAsyncThunk(
  "budget/fetchAnalytics",
  async (month, { rejectWithValue }) => {
    try {
      const response = await api.get(`/api/transaction/analytics${month ? `?month=${month}` : ""}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const saveCategoryBudget = createAsyncThunk(
  "budget/saveCategoryBudget",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await api.put("/api/transaction/budget", payload);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

const budgetSlice = createSlice({
  name: "budget",
  initialState: {
    analytics: null,
    status: "idle",
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchBudgetAnalytics.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchBudgetAnalytics.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.analytics = action.payload;
      })
      .addCase(fetchBudgetAnalytics.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || action.error.message;
      })
      .addCase(saveCategoryBudget.fulfilled, (state) => {
        state.status = "idle";
      });
  },
});

export default budgetSlice.reducer;