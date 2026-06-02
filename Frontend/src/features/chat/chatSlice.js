import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../services/api";

const CHAT_ENDPOINT = "/api/chats";

export const fetchChatThreads = createAsyncThunk(
  "chat/fetchThreads",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(`${CHAT_ENDPOINT}/threads`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const startDirectChat = createAsyncThunk(
  "chat/startDirect",
  async (recipientId, { rejectWithValue }) => {
    try {
      const response = await api.post(`${CHAT_ENDPOINT}/threads/direct`, { recipientId });
      return response.data.thread;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const fetchChatMessages = createAsyncThunk(
  "chat/fetchMessages",
  async (threadId, { rejectWithValue }) => {
    try {
      const response = await api.get(`${CHAT_ENDPOINT}/threads/${threadId}/messages`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const sendChatMessage = createAsyncThunk(
  "chat/sendMessage",
  async ({ threadId, content }, { rejectWithValue }) => {
    try {
      const response = await api.post(`${CHAT_ENDPOINT}/threads/${threadId}/messages`, { content });
      return { threadId, ...response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

const upsertThread = (threads, thread) => {
  if (!thread?._id) return threads;
  const nextThreads = threads.filter((item) => item._id !== thread._id);
  return [thread, ...nextThreads];
};

const chatSlice = createSlice({
  name: "chat",
  initialState: {
    threads: [],
    connections: [],
    department: "",
    selectedThreadId: null,
    messagesByThreadId: {},
    status: "idle",
    messageStatusByThreadId: {},
    sendStatus: "idle",
    error: null,
  },
  reducers: {
    selectChatThread: (state, action) => {
      state.selectedThreadId = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchChatThreads.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchChatThreads.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.threads = action.payload.threads || [];
        state.connections = action.payload.connections || [];
        state.department = action.payload.department || "";
        if (!state.selectedThreadId && state.threads.length > 0) {
          state.selectedThreadId = state.threads[0]._id;
        }
      })
      .addCase(fetchChatThreads.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || action.error.message;
      })
      .addCase(startDirectChat.fulfilled, (state, action) => {
        state.threads = upsertThread(state.threads, action.payload);
        state.selectedThreadId = action.payload?._id || state.selectedThreadId;
      })
      .addCase(fetchChatMessages.pending, (state, action) => {
        state.messageStatusByThreadId[action.meta.arg] = "loading";
      })
      .addCase(fetchChatMessages.fulfilled, (state, action) => {
        const thread = action.payload.thread;
        state.messageStatusByThreadId[thread._id] = "succeeded";
        state.messagesByThreadId[thread._id] = action.payload.messages || [];
        state.threads = upsertThread(state.threads, thread);
      })
      .addCase(fetchChatMessages.rejected, (state, action) => {
        state.messageStatusByThreadId[action.meta.arg] = "failed";
        state.error = action.payload || action.error.message;
      })
      .addCase(sendChatMessage.pending, (state) => {
        state.sendStatus = "loading";
      })
      .addCase(sendChatMessage.fulfilled, (state, action) => {
        state.sendStatus = "succeeded";
        const messages = state.messagesByThreadId[action.payload.threadId] || [];
        state.messagesByThreadId[action.payload.threadId] = [...messages, action.payload.message];
        state.threads = upsertThread(state.threads, action.payload.thread);
      })
      .addCase(sendChatMessage.rejected, (state, action) => {
        state.sendStatus = "failed";
        state.error = action.payload || action.error.message;
      });
  },
});

export const { selectChatThread } = chatSlice.actions;
export default chatSlice.reducer;
