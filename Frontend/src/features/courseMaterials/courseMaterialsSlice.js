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

export const fetchCourseMaterials = createAsyncThunk(
  "courseMaterials/fetchCourseMaterials",
  async ({ courseId, filters }, { rejectWithValue }) => {
    try {
      const response = await api.get(`/api/courses/${courseId}/materials${buildQuery(filters)}`);
      return { courseId, materials: response.data.materials || [], viewerContext: response.data.viewerContext || {} };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const uploadCourseMaterial = createAsyncThunk(
  "courseMaterials/uploadCourseMaterial",
  async ({ courseId, formData }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/api/courses/${courseId}/materials`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return { courseId, material: response.data.material };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const deleteCourseMaterial = createAsyncThunk(
  "courseMaterials/deleteCourseMaterial",
  async ({ courseId, materialId }, { rejectWithValue }) => {
    try {
      await api.delete(`/api/courses/${courseId}/materials/${materialId}`);
      return { courseId, materialId };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

const courseMaterialsSlice = createSlice({
  name: "courseMaterials",
  initialState: {
    itemsByCourseId: {},
    statusByCourseId: {},
    viewerContextByCourseId: {},
    filtersByCourseId: {},
    uploadStatus: "idle",
    actionLoadingById: {},
    error: null,
  },
  reducers: {
    setMaterialFilters: (state, action) => {
      const { courseId, filters } = action.payload;
      state.filtersByCourseId[courseId] = { ...(state.filtersByCourseId[courseId] || {}), ...filters };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCourseMaterials.pending, (state, action) => {
        state.statusByCourseId[action.meta.arg.courseId] = "loading";
        state.error = null;
      })
      .addCase(fetchCourseMaterials.fulfilled, (state, action) => {
        state.statusByCourseId[action.payload.courseId] = "succeeded";
        state.itemsByCourseId[action.payload.courseId] = action.payload.materials;
        state.viewerContextByCourseId[action.payload.courseId] = action.payload.viewerContext;
      })
      .addCase(fetchCourseMaterials.rejected, (state, action) => {
        state.statusByCourseId[action.meta.arg.courseId] = "failed";
        state.error = action.payload || action.error.message;
      })
      .addCase(uploadCourseMaterial.pending, (state) => {
        state.uploadStatus = "loading";
      })
      .addCase(uploadCourseMaterial.fulfilled, (state, action) => {
        state.uploadStatus = "succeeded";
        const list = state.itemsByCourseId[action.payload.courseId] || [];
        state.itemsByCourseId[action.payload.courseId] = [action.payload.material, ...list];
      })
      .addCase(uploadCourseMaterial.rejected, (state, action) => {
        state.uploadStatus = "failed";
        state.error = action.payload || action.error.message;
      })
      .addCase(deleteCourseMaterial.pending, (state, action) => {
        state.actionLoadingById[action.meta.arg.materialId] = true;
      })
      .addCase(deleteCourseMaterial.fulfilled, (state, action) => {
        delete state.actionLoadingById[action.payload.materialId];
        state.itemsByCourseId[action.payload.courseId] = (state.itemsByCourseId[action.payload.courseId] || []).filter(
          (material) => material._id !== action.payload.materialId
        );
      })
      .addCase(deleteCourseMaterial.rejected, (state, action) => {
        delete state.actionLoadingById[action.meta.arg?.materialId];
        state.error = action.payload || action.error.message;
      });
  },
});

export const { setMaterialFilters } = courseMaterialsSlice.actions;
export default courseMaterialsSlice.reducer;