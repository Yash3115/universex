import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../services/api";

const buildQuery = (filters) => {
  const params = new URLSearchParams();
  Object.entries(filters || {}).forEach(([key, value]) => {
    if (value) params.append(key, value);
  });
  const query = params.toString();
  return query ? `?${query}` : "";
};

export const searchStudents = createAsyncThunk(
  "discovery/searchStudents",
  async (filters, { rejectWithValue }) => {
    try {
      const response = await api.get(`/api/discovery/students${buildQuery(filters)}`);
      return response.data.students || [];
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const requestConnection = createAsyncThunk(
  "discovery/requestConnection",
  async (recipientId, { rejectWithValue }) => {
    try {
      const response = await api.post("/api/discovery/connections", { recipientId });
      return {
        recipientId,
        connection: response.data.connection,
        connectionState: response.data.connectionState,
        message: response.data.message,
      };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const respondToConnection = createAsyncThunk(
  "discovery/respondToConnection",
  async ({ connectionId, status, studentId }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/api/discovery/connections/${connectionId}`, { status });
      return {
        studentId,
        connection: response.data.connection,
        connectionState: response.data.connectionState,
        message: response.data.message,
      };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

const defaultConnection = { id: null, status: "none", direction: "none" };

const getStudentConnectionState = (student) =>
  student.connection || {
    ...defaultConnection,
    status: student.connectionStatus || "none",
  };

const applyConnectionState = (student, connectionState) => {
  const nextConnection = connectionState || defaultConnection;
  return {
    ...student,
    connection: nextConnection,
    connectionStatus: nextConnection.status,
  };
};

const discoverySlice = createSlice({
  name: "discovery",
  initialState: {
    students: [],
    status: "idle",
    error: null,
    actionLoadingByStudentId: {},
    actionLoadingByConnectionId: {},
    filters: { search: "", department: "", college: "", graduationYear: "" },
  },
  reducers: {
    setDiscoveryFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(searchStudents.pending, (state) => {
        state.status = "loading";
      })
      .addCase(searchStudents.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.students = action.payload.map((student) =>
          applyConnectionState(student, getStudentConnectionState(student))
        );
      })
      .addCase(searchStudents.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || action.error.message;
      })
      .addCase(requestConnection.pending, (state, action) => {
        state.actionLoadingByStudentId[action.meta.arg] = true;
      })
      .addCase(requestConnection.fulfilled, (state, action) => {
        delete state.actionLoadingByStudentId[action.payload.recipientId];
        state.students = state.students.map((student) =>
          student._id === action.payload.recipientId
            ? applyConnectionState(student, action.payload.connectionState)
            : student
        );
      })
      .addCase(requestConnection.rejected, (state, action) => {
        delete state.actionLoadingByStudentId[action.meta.arg];
      })
      .addCase(respondToConnection.pending, (state, action) => {
        const { connectionId, studentId } = action.meta.arg;
        if (studentId) state.actionLoadingByStudentId[studentId] = true;
        state.actionLoadingByConnectionId[connectionId] = true;
      })
      .addCase(respondToConnection.fulfilled, (state, action) => {
        const { connection, connectionState, studentId } = action.payload;
        if (studentId) delete state.actionLoadingByStudentId[studentId];
        if (connection?._id) delete state.actionLoadingByConnectionId[connection._id];
        state.students = state.students.map((student) => {
          const matchesStudent = studentId && student._id === studentId;
          const connectionId = student.connection?.id || student.connection?._id;
          const matchesConnection = connection?._id && String(connectionId) === String(connection._id);
          return matchesStudent || matchesConnection
            ? applyConnectionState(student, connectionState)
            : student;
        });
      })
      .addCase(respondToConnection.rejected, (state, action) => {
        const { connectionId, studentId } = action.meta.arg || {};
        if (studentId) delete state.actionLoadingByStudentId[studentId];
        if (connectionId) delete state.actionLoadingByConnectionId[connectionId];
      });
  },
});

export const { setDiscoveryFilters } = discoverySlice.actions;
export default discoverySlice.reducer;