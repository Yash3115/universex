import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../services/api";

export const fetchCourseAssessments = createAsyncThunk(
  "results/fetchCourseAssessments",
  async (courseId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/api/results/courses/${courseId}/assessments`);
      return { courseId, assessments: response.data.assessments || [], viewerContext: response.data.viewerContext || {} };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const createAssessment = createAsyncThunk(
  "results/createAssessment",
  async ({ courseId, payload }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/api/results/courses/${courseId}/assessments`, payload);
      return { courseId, assessment: response.data.assessment };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const fetchAssessmentGrades = createAsyncThunk(
  "results/fetchAssessmentGrades",
  async (assessmentId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/api/results/assessments/${assessmentId}/grades`);
      return { assessmentId, grades: response.data.grades || [] };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const saveAssessmentGrades = createAsyncThunk(
  "results/saveAssessmentGrades",
  async ({ assessmentId, grades }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/api/results/assessments/${assessmentId}/grades`, { grades });
      return { assessmentId, grades: response.data.grades || [] };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const publishAssessment = createAsyncThunk(
  "results/publishAssessment",
  async ({ assessmentId, payload }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/api/results/assessments/${assessmentId}/publish`, payload);
      return response.data.assessment;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const fetchMyResults = createAsyncThunk(
  "results/fetchMyResults",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/api/results/mine");
      return response.data.results || [];
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

const resultsSlice = createSlice({
  name: "results",
  initialState: {
    assessmentsByCourseId: {},
    statusByCourseId: {},
    viewerContextByCourseId: {},
    gradesByAssessmentId: {},
    gradeStatusByAssessmentId: {},
    myResults: [],
    myResultsStatus: "idle",
    actionStatus: "idle",
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCourseAssessments.pending, (state, action) => {
        state.statusByCourseId[action.meta.arg] = "loading";
      })
      .addCase(fetchCourseAssessments.fulfilled, (state, action) => {
        state.statusByCourseId[action.payload.courseId] = "succeeded";
        state.assessmentsByCourseId[action.payload.courseId] = action.payload.assessments;
        state.viewerContextByCourseId[action.payload.courseId] = action.payload.viewerContext;
      })
      .addCase(fetchCourseAssessments.rejected, (state, action) => {
        state.statusByCourseId[action.meta.arg] = "failed";
        state.error = action.payload || action.error.message;
      })
      .addCase(createAssessment.pending, (state) => {
        state.actionStatus = "loading";
      })
      .addCase(createAssessment.fulfilled, (state, action) => {
        state.actionStatus = "succeeded";
        state.assessmentsByCourseId[action.payload.courseId] = [
          action.payload.assessment,
          ...(state.assessmentsByCourseId[action.payload.courseId] || []),
        ];
      })
      .addCase(createAssessment.rejected, (state, action) => {
        state.actionStatus = "failed";
        state.error = action.payload || action.error.message;
      })
      .addCase(fetchAssessmentGrades.pending, (state, action) => {
        state.gradeStatusByAssessmentId[action.meta.arg] = "loading";
      })
      .addCase(fetchAssessmentGrades.fulfilled, (state, action) => {
        state.gradeStatusByAssessmentId[action.payload.assessmentId] = "succeeded";
        state.gradesByAssessmentId[action.payload.assessmentId] = action.payload.grades;
      })
      .addCase(saveAssessmentGrades.fulfilled, (state, action) => {
        state.gradesByAssessmentId[action.payload.assessmentId] = action.payload.grades;
      })
      .addCase(publishAssessment.fulfilled, (state, action) => {
        const updated = action.payload;
        Object.keys(state.assessmentsByCourseId).forEach((courseId) => {
          state.assessmentsByCourseId[courseId] = state.assessmentsByCourseId[courseId].map((assessment) =>
            assessment._id === updated._id ? updated : assessment
          );
        });
      })
      .addCase(fetchMyResults.pending, (state) => {
        state.myResultsStatus = "loading";
      })
      .addCase(fetchMyResults.fulfilled, (state, action) => {
        state.myResultsStatus = "succeeded";
        state.myResults = action.payload;
      })
      .addCase(fetchMyResults.rejected, (state, action) => {
        state.myResultsStatus = "failed";
        state.error = action.payload || action.error.message;
      });
  },
});

export default resultsSlice.reducer;