import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/auth/authSlice";
import postsReducer from "../features/posts/postsSlice";
import jobsReducer from "../features/jobs/jobsSlice";
import academicReducer from "../features/academic/academicSlice";
import notificationsReducer from "../features/notifications/notificationsSlice";
import budgetReducer from "../features/budget/budgetSlice";
import discoveryReducer from "../features/discovery/discoverySlice";
import interactionsReducer from "../features/interactions/interactionsSlice";
import coursesReducer from "../features/courses/coursesSlice";
import courseMaterialsReducer from "../features/courseMaterials/courseMaterialsSlice";
import courseAnnouncementsReducer from "../features/courseAnnouncements/courseAnnouncementsSlice";
import assignmentsReducer from "../features/assignments/assignmentsSlice";
import resultsReducer from "../features/results/resultsSlice";
import courseQAReducer from "../features/courseQA/courseQASlice";
import courseAttendanceReducer from "../features/courseAttendance/courseAttendanceSlice";


const store = configureStore({
  reducer: {
    auth: authReducer,
    posts: postsReducer,
    jobs: jobsReducer,
    academic: academicReducer,
    notifications: notificationsReducer,
    budget: budgetReducer,
    discovery: discoveryReducer,
    interactions: interactionsReducer,
    courses: coursesReducer,
    courseMaterials: courseMaterialsReducer,
    courseAnnouncements: courseAnnouncementsReducer,
    assignments: assignmentsReducer,
    results: resultsReducer,
    courseQA: courseQAReducer,
    courseAttendance: courseAttendanceReducer,

  },
});

export default store;