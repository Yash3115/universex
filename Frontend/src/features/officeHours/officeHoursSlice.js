import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../services/api";

export const fetchCourseOfficeHourSlots = createAsyncThunk("officeHours/fetchCourseSlots", async (courseId, { rejectWithValue }) => {
  try {
    const response = await api.get(`/api/office-hours/courses/${courseId}/slots`);
    return { courseId, slots: response.data.slots || [], myBookings: response.data.myBookings || [] };
  } catch (error) { return rejectWithValue(error.response?.data?.message || error.message); }
});

export const fetchMyOfficeHourBookings = createAsyncThunk("officeHours/fetchMyBookings", async (_, { rejectWithValue }) => {
  try { const response = await api.get("/api/office-hours/bookings/mine"); return response.data.bookings || []; }
  catch (error) { return rejectWithValue(error.response?.data?.message || error.message); }
});

export const fetchProfessorOfficeHourBookings = createAsyncThunk("officeHours/fetchProfessorBookings", async (_, { rejectWithValue }) => {
  try { const response = await api.get("/api/office-hours/bookings/professor"); return response.data.bookings || []; }
  catch (error) { return rejectWithValue(error.response?.data?.message || error.message); }
});

export const createOfficeHourSlot = createAsyncThunk("officeHours/createSlot", async (payload, { rejectWithValue }) => {
  try { const response = await api.post("/api/office-hours/slots", payload); return response.data.slot; }
  catch (error) { return rejectWithValue(error.response?.data?.message || error.message); }
});

export const bookOfficeHourSlot = createAsyncThunk("officeHours/bookSlot", async ({ slotId, reason }, { rejectWithValue }) => {
  try { const response = await api.post(`/api/office-hours/slots/${slotId}/book`, { reason }); return response.data.booking; }
  catch (error) { return rejectWithValue(error.response?.data?.message || error.message); }
});

export const updateOfficeHourSlot = createAsyncThunk("officeHours/updateSlot", async ({ courseId, slotId, payload }, { rejectWithValue }) => {
  try { const response = await api.patch(`/api/office-hours/slots/${slotId}`, payload); return { courseId, slot: response.data.slot }; }
  catch (error) { return rejectWithValue(error.response?.data?.message || error.message); }
});

export const updateOfficeHourBookingStatus = createAsyncThunk("officeHours/updateBooking", async ({ bookingId, status, note }, { rejectWithValue }) => {
  try { const response = await api.patch(`/api/office-hours/bookings/${bookingId}/status`, { status, note }); return response.data.booking; }
  catch (error) { return rejectWithValue(error.response?.data?.message || error.message); }
});

const officeHoursSlice = createSlice({
  name: "officeHours",
  initialState: { slotsByCourseId: {}, bookingsByCourseId: {}, myBookings: [], professorBookings: [], statusByCourseId: {}, myBookingsStatus: "idle", professorBookingsStatus: "idle", actionStatus: "idle", error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCourseOfficeHourSlots.pending, (state, action) => { state.statusByCourseId[action.meta.arg] = "loading"; })
      .addCase(fetchCourseOfficeHourSlots.fulfilled, (state, action) => { state.statusByCourseId[action.payload.courseId] = "succeeded"; state.slotsByCourseId[action.payload.courseId] = action.payload.slots; state.bookingsByCourseId[action.payload.courseId] = action.payload.myBookings; })
      .addCase(fetchCourseOfficeHourSlots.rejected, (state, action) => { state.statusByCourseId[action.meta.arg] = "failed"; state.error = action.payload || action.error.message; })
      .addCase(fetchMyOfficeHourBookings.fulfilled, (state, action) => { state.myBookingsStatus = "succeeded"; state.myBookings = action.payload; })
      .addCase(fetchProfessorOfficeHourBookings.fulfilled, (state, action) => { state.professorBookingsStatus = "succeeded"; state.professorBookings = action.payload; })
      .addCase(createOfficeHourSlot.fulfilled, (state, action) => { const courseId = action.payload.course?._id || action.payload.course; if (courseId) state.slotsByCourseId[courseId] = [action.payload, ...(state.slotsByCourseId[courseId] || [])]; })
      .addCase(bookOfficeHourSlot.fulfilled, (state, action) => { const courseId = action.payload.course?._id || action.payload.course; if (courseId) state.bookingsByCourseId[courseId] = [action.payload, ...(state.bookingsByCourseId[courseId] || [])]; state.myBookings.unshift(action.payload); })
      .addCase(updateOfficeHourSlot.fulfilled, (state, action) => { if (action.payload.courseId) state.slotsByCourseId[action.payload.courseId] = (state.slotsByCourseId[action.payload.courseId] || []).map((slot) => slot._id === action.payload.slot._id ? action.payload.slot : slot); })
      .addCase(updateOfficeHourBookingStatus.fulfilled, (state, action) => { const updated = action.payload; state.myBookings = state.myBookings.map((b) => b._id === updated._id ? updated : b); state.professorBookings = state.professorBookings.map((b) => b._id === updated._id ? updated : b); Object.keys(state.bookingsByCourseId).forEach((courseId) => { state.bookingsByCourseId[courseId] = state.bookingsByCourseId[courseId].map((b) => b._id === updated._id ? updated : b); }); });
  },
});

export default officeHoursSlice.reducer;