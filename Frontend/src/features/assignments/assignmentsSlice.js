import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../services/api";

export const fetchCourseAssignments = createAsyncThunk(
  "assignments/fetchCourseAssignments",
  async (courseId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/api/assignments/courses/${courseId}`);
      return { courseId, assignments: response.data.assignments || [], viewerContext: response.data.viewerContext || {} };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const createAssignment = createAsyncThunk(
  "assignments/createAssignment",
  async ({ courseId, formData }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/api/assignments/courses/${courseId}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return { courseId, assignment: response.data.assignment };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const submitAssignment = createAsyncThunk(
  "assignments/submitAssignment",
  async ({ assignmentId, formData }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/api/assignments/${assignmentId}/submit`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return { assignmentId, submission: response.data.submission };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const fetchAssignmentSubmissions = createAsyncThunk(
  "assignments/fetchAssignmentSubmissions",
  async (assignmentId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/api/assignments/${assignmentId}/submissions`);
      return { assignmentId, submissions: response.data.submissions || [] };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const gradeSubmission = createAsyncThunk(
  "assignments/gradeSubmission",
  async ({ submissionId, payload }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/api/assignments/submissions/${submissionId}/grade`, payload);
      return response.data.submission;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

const assignmentsSlice = createSlice({
  name: "assignments",
  initialState: {
    assignmentsByCourseId: {},
    statusByCourseId: {},
    viewerContextByCourseId: {},
    submissionsByAssignmentId: {},
    submissionStatusByAssignmentId: {},
    createStatus: "idle",
    submitStatus: "idle",
    gradeStatus: "idle",
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCourseAssignments.pending, (state, action) => {
        state.statusByCourseId[action.meta.arg] = "loading";
      })
      .addCase(fetchCourseAssignments.fulfilled, (state, action) => {
        state.statusByCourseId[action.payload.courseId] = "succeeded";
        state.assignmentsByCourseId[action.payload.courseId] = action.payload.assignments;
        state.viewerContextByCourseId[action.payload.courseId] = action.payload.viewerContext;
      })
      .addCase(fetchCourseAssignments.rejected, (state, action) => {
        state.statusByCourseId[action.meta.arg] = "failed";
        state.error = action.payload || action.error.message;
      })
      .addCase(createAssignment.pending, (state) => {
        state.createStatus = "loading";
      })
      .addCase(createAssignment.fulfilled, (state, action) => {
        state.createStatus = "succeeded";
        const list = state.assignmentsByCourseId[action.payload.courseId] || [];
        state.assignmentsByCourseId[action.payload.courseId] = [action.payload.assignment, ...list];
      })
      .addCase(createAssignment.rejected, (state, action) => {
        state.createStatus = "failed";
        state.error = action.payload || action.error.message;
      })
      .addCase(submitAssignment.pending, (state) => {
        state.submitStatus = "loading";
      })
      .addCase(submitAssignment.fulfilled, (state, action) => {
        state.submitStatus = "succeeded";
        Object.keys(state.assignmentsByCourseId).forEach((courseId) => {
          state.assignmentsByCourseId[courseId] = state.assignmentsByCourseId[courseId].map((assignment) =>
            assignment._id === action.payload.assignmentId ? { ...assignment, mySubmission: action.payload.submission } : assignment
          );
        });
      })
      .addCase(submitAssignment.rejected, (state, action) => {
        state.submitStatus = "failed";
        state.error = action.payload || action.error.message;
      })
      .addCase(fetchAssignmentSubmissions.pending, (state, action) => {
        state.submissionStatusByAssignmentId[action.meta.arg] = "loading";
      })
      .addCase(fetchAssignmentSubmissions.fulfilled, (state, action) => {
        state.submissionStatusByAssignmentId[action.payload.assignmentId] = "succeeded";
        state.submissionsByAssignmentId[action.payload.assignmentId] = action.payload.submissions;
      })
      .addCase(gradeSubmission.pending, (state) => {
        state.gradeStatus = "loading";
      })
      .addCase(gradeSubmission.fulfilled, (state, action) => {
        state.gradeStatus = "succeeded";
        const updated = action.payload;
        if (updated?.assignment?._id) {
          state.submissionsByAssignmentId[updated.assignment._id] = (state.submissionsByAssignmentId[updated.assignment._id] || []).map((submission) =>
            submission._id === updated._id ? updated : submission
          );
        }
      })
      .addCase(gradeSubmission.rejected, (state, action) => {
        state.gradeStatus = "failed";
        state.error = action.payload || action.error.message;
      });
  },
});

export default assignmentsSlice.reducer;