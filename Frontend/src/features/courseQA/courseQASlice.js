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

export const fetchCourseQuestions = createAsyncThunk(
  "courseQA/fetchCourseQuestions",
  async ({ courseId, filters }, { rejectWithValue }) => {
    try {
      const response = await api.get(`/api/course-qa/courses/${courseId}/questions${buildQuery(filters)}`);
      return { courseId, questions: response.data.questions || [], viewerContext: response.data.viewerContext || {} };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const createCourseQuestion = createAsyncThunk(
  "courseQA/createCourseQuestion",
  async ({ courseId, payload }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/api/course-qa/courses/${courseId}/questions`, payload);
      return { courseId, question: response.data.question };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const createCourseAnswer = createAsyncThunk(
  "courseQA/createCourseAnswer",
  async ({ courseId, questionId, body }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/api/course-qa/questions/${questionId}/answers`, { body });
      return { courseId, question: response.data.question };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const updateQuestionStatus = createAsyncThunk(
  "courseQA/updateQuestionStatus",
  async ({ courseId, questionId, status }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/api/course-qa/questions/${questionId}/status`, { status });
      return { courseId, question: response.data.question };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const toggleQuestionUpvote = createAsyncThunk(
  "courseQA/toggleQuestionUpvote",
  async ({ courseId, questionId }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/api/course-qa/questions/${questionId}/upvote`);
      return { courseId, question: response.data.question };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const markAnswerOfficial = createAsyncThunk(
  "courseQA/markAnswerOfficial",
  async ({ courseId, answerId }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/api/course-qa/answers/${answerId}/official`);
      return { courseId, question: response.data.question };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const toggleAnswerHelpful = createAsyncThunk(
  "courseQA/toggleAnswerHelpful",
  async ({ courseId, answerId }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/api/course-qa/answers/${answerId}/helpful`);
      return { courseId, question: response.data.question };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

const replaceQuestion = (questions = [], updatedQuestion) =>
  questions.map((question) => (question._id === updatedQuestion._id ? updatedQuestion : question));

const courseQASlice = createSlice({
  name: "courseQA",
  initialState: {
    questionsByCourseId: {},
    statusByCourseId: {},
    viewerContextByCourseId: {},
    filtersByCourseId: {},
    actionLoadingById: {},
    createStatus: "idle",
    answerStatus: "idle",
    error: null,
  },
  reducers: {
    setQuestionFilters: (state, action) => {
      const { courseId, filters } = action.payload;
      state.filtersByCourseId[courseId] = { ...(state.filtersByCourseId[courseId] || {}), ...filters };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCourseQuestions.pending, (state, action) => {
        state.statusByCourseId[action.meta.arg.courseId] = "loading";
      })
      .addCase(fetchCourseQuestions.fulfilled, (state, action) => {
        state.statusByCourseId[action.payload.courseId] = "succeeded";
        state.questionsByCourseId[action.payload.courseId] = action.payload.questions;
        state.viewerContextByCourseId[action.payload.courseId] = action.payload.viewerContext;
      })
      .addCase(fetchCourseQuestions.rejected, (state, action) => {
        state.statusByCourseId[action.meta.arg.courseId] = "failed";
        state.error = action.payload || action.error.message;
      })
      .addCase(createCourseQuestion.pending, (state) => {
        state.createStatus = "loading";
      })
      .addCase(createCourseQuestion.fulfilled, (state, action) => {
        state.createStatus = "succeeded";
        state.questionsByCourseId[action.payload.courseId] = [
          action.payload.question,
          ...(state.questionsByCourseId[action.payload.courseId] || []),
        ];
      })
      .addCase(createCourseQuestion.rejected, (state, action) => {
        state.createStatus = "failed";
        state.error = action.payload || action.error.message;
      })
      .addCase(createCourseAnswer.pending, (state) => {
        state.answerStatus = "loading";
      })
      .addMatcher(
        (action) => [createCourseAnswer.fulfilled.type, updateQuestionStatus.fulfilled.type, toggleQuestionUpvote.fulfilled.type, markAnswerOfficial.fulfilled.type, toggleAnswerHelpful.fulfilled.type].includes(action.type),
        (state, action) => {
          state.answerStatus = "succeeded";
          state.questionsByCourseId[action.payload.courseId] = replaceQuestion(
            state.questionsByCourseId[action.payload.courseId] || [],
            action.payload.question
          );
        }
      )
      .addMatcher(
        (action) => [createCourseAnswer.rejected.type, updateQuestionStatus.rejected.type, toggleQuestionUpvote.rejected.type, markAnswerOfficial.rejected.type, toggleAnswerHelpful.rejected.type].includes(action.type),
        (state, action) => {
          state.answerStatus = "failed";
          state.error = action.payload || action.error.message;
        }
      );
  },
});

export const { setQuestionFilters } = courseQASlice.actions;
export default courseQASlice.reducer;