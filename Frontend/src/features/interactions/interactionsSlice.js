import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../services/api";

const INTERACTIONS_ENDPOINT = "/api/interactions";

const buildQuery = (filters = {}) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.append(key, value);
  });
  const query = params.toString();
  return query ? `?${query}` : "";
};

export const fetchInteractions = createAsyncThunk(
  "interactions/fetchInteractions",
  async (filters, { rejectWithValue }) => {
    try {
      const response = await api.get(`${INTERACTIONS_ENDPOINT}${buildQuery(filters)}`);
      return response.data.interactions || [];
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const fetchInteractionSummary = createAsyncThunk(
  "interactions/fetchInteractionSummary",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(`${INTERACTIONS_ENDPOINT}/summary`);
      return response.data.summary || {};
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const createInteraction = createAsyncThunk(
  "interactions/createInteraction",
  async (interactionData, { rejectWithValue }) => {
    try {
      const response = await api.post(INTERACTIONS_ENDPOINT, interactionData);
      return response.data.interaction;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const updateInteractionStatus = createAsyncThunk(
  "interactions/updateInteractionStatus",
  async ({ interactionId, status }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`${INTERACTIONS_ENDPOINT}/${interactionId}/status`, { status });
      return response.data.interaction;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

const initialState = {
  items: [],
  status: "idle",
  error: null,
  createStatus: "idle",
  summaryStatus: "idle",
  actionLoadingById: {},
  filters: { box: "incoming", status: "pending", type: "", search: "" },
  summary: { pendingIncoming: 0, pendingSent: 0, accepted: 0, completed: 0 },
};

const interactionsSlice = createSlice({
  name: "interactions",
  initialState,
  reducers: {
    setInteractionFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchInteractions.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchInteractions.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchInteractions.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || action.error.message;
      })
      .addCase(fetchInteractionSummary.pending, (state) => {
        state.summaryStatus = "loading";
      })
      .addCase(fetchInteractionSummary.fulfilled, (state, action) => {
        state.summaryStatus = "succeeded";
        state.summary = { ...state.summary, ...action.payload };
      })
      .addCase(fetchInteractionSummary.rejected, (state) => {
        state.summaryStatus = "failed";
      })
      .addCase(createInteraction.pending, (state) => {
        state.createStatus = "loading";
      })
      .addCase(createInteraction.fulfilled, (state, action) => {
        state.createStatus = "succeeded";
        state.items.unshift(action.payload);
      })
      .addCase(createInteraction.rejected, (state, action) => {
        state.createStatus = "failed";
        state.error = action.payload || action.error.message;
      })
      .addCase(updateInteractionStatus.pending, (state, action) => {
        state.actionLoadingById[action.meta.arg.interactionId] = true;
      })
      .addCase(updateInteractionStatus.fulfilled, (state, action) => {
        const updated = action.payload;
        if (updated?._id) {
          delete state.actionLoadingById[updated._id];
          state.items = state.items.map((item) => (item._id === updated._id ? updated : item));
        }
      })
      .addCase(updateInteractionStatus.rejected, (state, action) => {
        delete state.actionLoadingById[action.meta.arg?.interactionId];
        state.error = action.payload || action.error.message;
      });
  },
});

export const { setInteractionFilters } = interactionsSlice.actions;
export default interactionsSlice.reducer;