import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/auth/authSlice";
import postsReducer from "../features/posts/postsSlice";
import jobsReducer from "../features/jobs/jobsSlice";
import academicReducer from "../features/academic/academicSlice";
import notificationsReducer from "../features/notifications/notificationsSlice";
import budgetReducer from "../features/budget/budgetSlice";
import discoveryReducer from "../features/discovery/discoverySlice";
import interactionsReducer from "../features/interactions/interactionsSlice";


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

  },
});

export default store;