import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../services/api";

const NOTIFICATIONS_ENDPOINT = "/api/notifications";

export const fetchNotifications = createAsyncThunk(
  "notifications/fetch",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(NOTIFICATIONS_ENDPOINT);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const markNotificationRead = createAsyncThunk(
  "notifications/markRead",
  async (notificationId, { rejectWithValue }) => {
    try {
      const response = await api.put(`${NOTIFICATIONS_ENDPOINT}/${notificationId}`);
      return response.data.notification;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const markAllNotificationsRead = createAsyncThunk(
  "notifications/markAllRead",
  async (_, { rejectWithValue }) => {
    try {
      await api.put(`${NOTIFICATIONS_ENDPOINT}/read-all`);
      return true;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const respondToConnectionNotification = createAsyncThunk(
  "notifications/respondToConnection",
  async ({ connectionId, notificationId, status }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/api/discovery/connections/${connectionId}`, { status });
      if (notificationId) {
        await api.put(`${NOTIFICATIONS_ENDPOINT}/${notificationId}`);
      }
      return {
        notificationId,
        connectionId,
        status,
        connection: response.data.connection,
        connectionState: response.data.connectionState,
        message: response.data.message,
      };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

const notificationsSlice = createSlice({
  name: "notifications",
  initialState: {
    items: [],
    unreadCount: 0,
    status: "idle",
    error: null,
    actionLoadingByConnectionId: {},
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload.notifications || [];
        state.unreadCount = action.payload.unreadCount || 0;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || action.error.message;
      })
      .addCase(markNotificationRead.fulfilled, (state, action) => {
        state.items = state.items.map((item) =>
          item._id === action.payload?._id ? { ...item, read: true } : item
        );
        state.unreadCount = state.items.filter((item) => !item.read).length;
      })
      .addCase(markAllNotificationsRead.fulfilled, (state) => {
        state.items = state.items.map((item) => ({ ...item, read: true }));
        state.unreadCount = 0;
      })
      .addCase(respondToConnectionNotification.pending, (state, action) => {
        const { connectionId } = action.meta.arg;
        state.actionLoadingByConnectionId[connectionId] = true;
      })
      .addCase(respondToConnectionNotification.fulfilled, (state, action) => {
        const { connection, connectionId, notificationId } = action.payload;
        delete state.actionLoadingByConnectionId[connectionId];
        state.items = state.items.map((item) => {
          const itemConnectionId = item.connection?._id || item.connection;
          if (item._id === notificationId || String(itemConnectionId) === String(connection?._id || connectionId)) {
            return {
              ...item,
              read: true,
              connection: connection ? { ...(item.connection || {}), ...connection } : item.connection,
            };
          }
          return item;
        });
        state.unreadCount = state.items.filter((item) => !item.read).length;
      })
      .addCase(respondToConnectionNotification.rejected, (state, action) => {
        const { connectionId } = action.meta.arg || {};
        if (connectionId) delete state.actionLoadingByConnectionId[connectionId];
      });
  },
});

export default notificationsSlice.reducer;