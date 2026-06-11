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
      return {
        courseId,
        materials: response.data.materials || [],
        stats: response.data.stats || {},
        viewerContext: response.data.viewerContext || {},
      };
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

export const updateCourseMaterial = createAsyncThunk(
  "courseMaterials/updateCourseMaterial",
  async ({ courseId, materialId, formData }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/api/courses/${courseId}/materials/${materialId}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return { courseId, material: response.data.material };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const markCourseMaterialRead = createAsyncThunk(
  "courseMaterials/markCourseMaterialRead",
  async ({ courseId, materialId }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/api/courses/${courseId}/materials/${materialId}/read`);
      return { courseId, material: response.data.material };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const toggleCourseMaterialBookmark = createAsyncThunk(
  "courseMaterials/toggleCourseMaterialBookmark",
  async ({ courseId, materialId }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/api/courses/${courseId}/materials/${materialId}/bookmark`);
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

const upsertMaterial = (state, courseId, material) => {
  const list = state.itemsByCourseId[courseId] || [];
  const index = list.findIndex((item) => item._id === material._id);
  if (index >= 0) {
    list[index] = material;
    state.itemsByCourseId[courseId] = [...list];
  } else {
    state.itemsByCourseId[courseId] = [material, ...list];
  }
  state.statsByCourseId[courseId] = calculateVisibleStats(state.itemsByCourseId[courseId] || []);
};

const calculateVisibleStats = (materials = []) => {
  return {
    total: materials.length,
    draft: materials.filter((material) => material.status === "draft").length,
    scheduled: materials.filter((material) => material.status === "scheduled").length,
    published: materials.filter((material) => !material.status || material.status === "published").length,
    archived: materials.filter((material) => material.status === "archived").length,
    pinned: materials.filter((material) => material.pinned).length,
    unread: materials.filter((material) => !material.isRead).length,
    bookmarked: materials.filter((material) => material.isBookmarked).length,
  };
};

const courseMaterialsSlice = createSlice({
  name: "courseMaterials",
  initialState: {
    itemsByCourseId: {},
    statusByCourseId: {},
    statsByCourseId: {},
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
        state.statsByCourseId[action.payload.courseId] = action.payload.stats || {};
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
        upsertMaterial(state, action.payload.courseId, action.payload.material);
      })
      .addCase(uploadCourseMaterial.rejected, (state, action) => {
        state.uploadStatus = "failed";
        state.error = action.payload || action.error.message;
      })
      .addCase(updateCourseMaterial.pending, (state, action) => {
        state.actionLoadingById[action.meta.arg.materialId] = true;
      })
      .addCase(updateCourseMaterial.fulfilled, (state, action) => {
        delete state.actionLoadingById[action.payload.material._id];
        upsertMaterial(state, action.payload.courseId, action.payload.material);
      })
      .addCase(updateCourseMaterial.rejected, (state, action) => {
        delete state.actionLoadingById[action.meta.arg?.materialId];
        state.error = action.payload || action.error.message;
      })
      .addCase(markCourseMaterialRead.pending, (state, action) => {
        state.actionLoadingById[`${action.meta.arg.materialId}:read`] = true;
      })
      .addCase(markCourseMaterialRead.fulfilled, (state, action) => {
        delete state.actionLoadingById[`${action.payload.material._id}:read`];
        upsertMaterial(state, action.payload.courseId, action.payload.material);
      })
      .addCase(markCourseMaterialRead.rejected, (state, action) => {
        delete state.actionLoadingById[`${action.meta.arg?.materialId}:read`];
        state.error = action.payload || action.error.message;
      })
      .addCase(toggleCourseMaterialBookmark.pending, (state, action) => {
        state.actionLoadingById[`${action.meta.arg.materialId}:bookmark`] = true;
      })
      .addCase(toggleCourseMaterialBookmark.fulfilled, (state, action) => {
        delete state.actionLoadingById[`${action.payload.material._id}:bookmark`];
        upsertMaterial(state, action.payload.courseId, action.payload.material);
      })
      .addCase(toggleCourseMaterialBookmark.rejected, (state, action) => {
        delete state.actionLoadingById[`${action.meta.arg?.materialId}:bookmark`];
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
        state.statsByCourseId[action.payload.courseId] = calculateVisibleStats(state.itemsByCourseId[action.payload.courseId] || []);
      })
      .addCase(deleteCourseMaterial.rejected, (state, action) => {
        delete state.actionLoadingById[action.meta.arg?.materialId];
        state.error = action.payload || action.error.message;
      });
  },
});

export const { setMaterialFilters } = courseMaterialsSlice.actions;
export default courseMaterialsSlice.reducer;
