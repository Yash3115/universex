import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../services/api";

export const buildAiKey = ({ sourceType, sourceId = "self", kind, prompt = {} }) =>
  `${sourceType}:${sourceId || "self"}:${kind}:${JSON.stringify(prompt || {})}`;

export const generateAiArtifact = createAsyncThunk(
  "ai/generateArtifact",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await api.post("/api/ai/generate", payload);
      return {
        key: buildAiKey(payload),
        artifact: response.data.artifact,
      };
    } catch (error) {
      return rejectWithValue({
        key: buildAiKey(payload),
        message: error.response?.data?.message || error.message,
      });
    }
  }
);

const aiSlice = createSlice({
  name: "ai",
  initialState: {
    artifactsByKey: {},
    loadingByKey: {},
    errorByKey: {},
  },
  reducers: {
    clearAiError: (state, action) => {
      delete state.errorByKey[action.payload];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(generateAiArtifact.pending, (state, action) => {
        const key = buildAiKey(action.meta.arg);
        state.loadingByKey[key] = true;
        delete state.errorByKey[key];
      })
      .addCase(generateAiArtifact.fulfilled, (state, action) => {
        state.artifactsByKey[action.payload.key] = action.payload.artifact;
        delete state.loadingByKey[action.payload.key];
      })
      .addCase(generateAiArtifact.rejected, (state, action) => {
        const key = action.payload?.key || buildAiKey(action.meta.arg);
        delete state.loadingByKey[key];
        state.errorByKey[key] = action.payload?.message || action.error.message;
      });
  },
});

export const { clearAiError } = aiSlice.actions;
export default aiSlice.reducer;
