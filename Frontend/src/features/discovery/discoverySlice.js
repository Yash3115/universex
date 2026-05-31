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

export const fetchConnections = createAsyncThunk(
  "discovery/fetchConnections",
  async (filters, { rejectWithValue }) => {
    try {
      const response = await api.get(`/api/discovery/connections${buildQuery(filters)}`);
      return response.data.connections || [];
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const fetchConnectionSummary = createAsyncThunk(
  "discovery/fetchConnectionSummary",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/api/discovery/connections/summary");
      return response.data.summary || {};
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const removeConnection = createAsyncThunk(
  "discovery/removeConnection",
  async (connectionId, { rejectWithValue }) => {
    try {
      const response = await api.delete(`/api/discovery/connections/${connectionId}`);
      return {
        connectionId,
        message: response.data.message,
      };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const updateConnectionPreferences = createAsyncThunk(
  "discovery/updateConnectionPreferences",
  async ({ connectionId, preferences }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/api/discovery/connections/${connectionId}/preferences`, preferences);
      return response.data.connection;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const fetchStudentProfile = createAsyncThunk(
  "discovery/fetchStudentProfile",
  async (studentId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/api/discovery/students/${studentId}`);
      return response.data;
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
    connections: [],
    selectedStudentProfile: null,
    selectedStudentProfileStatus: "idle",
    selectedStudentProfileError: null,
    connectionsStatus: "idle",
    connectionsError: null,
    connectionSummary: {
      accepted: 0,
      incomingPending: 0,
      outgoingPending: 0,
      byDepartment: [],
      byGraduationYear: [],
      recentConnections: [],
    },
    summaryStatus: "idle",
    status: "idle",
    error: null,
    actionLoadingByStudentId: {},
    actionLoadingByConnectionId: {},
    filters: { search: "", department: "", college: "", graduationYear: "" },
    connectionFilters: { status: "accepted", direction: "connected", search: "", department: "", college: "", graduationYear: "" },
  },
  reducers: {
    setDiscoveryFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    setConnectionFilters: (state, action) => {
      state.connectionFilters = { ...state.connectionFilters, ...action.payload };
    },
    clearSelectedStudentProfile: (state) => {
      state.selectedStudentProfile = null;
      state.selectedStudentProfileStatus = "idle";
      state.selectedStudentProfileError = null;
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
        state.connectionsStatus = "idle";
        state.summaryStatus = "idle";
      })
      .addCase(respondToConnection.rejected, (state, action) => {
        const { connectionId, studentId } = action.meta.arg || {};
        if (studentId) delete state.actionLoadingByStudentId[studentId];
        if (connectionId) delete state.actionLoadingByConnectionId[connectionId];
      })
      .addCase(fetchConnections.pending, (state) => {
        state.connectionsStatus = "loading";
        state.connectionsError = null;
      })
      .addCase(fetchConnections.fulfilled, (state, action) => {
        state.connectionsStatus = "succeeded";
        state.connections = action.payload;
      })
      .addCase(fetchConnections.rejected, (state, action) => {
        state.connectionsStatus = "failed";
        state.connectionsError = action.payload || action.error.message;
      })
      .addCase(fetchConnectionSummary.pending, (state) => {
        state.summaryStatus = "loading";
      })
      .addCase(fetchConnectionSummary.fulfilled, (state, action) => {
        state.summaryStatus = "succeeded";
        state.connectionSummary = {
          ...state.connectionSummary,
          ...action.payload,
        };
      })
      .addCase(fetchConnectionSummary.rejected, (state) => {
        state.summaryStatus = "failed";
      })
      .addCase(removeConnection.pending, (state, action) => {
        state.actionLoadingByConnectionId[action.meta.arg] = true;
      })
      .addCase(removeConnection.fulfilled, (state, action) => {
        delete state.actionLoadingByConnectionId[action.payload.connectionId];
        state.connections = state.connections.filter(
          (connection) => String(connection._id) !== String(action.payload.connectionId)
        );
        state.students = state.students.map((student) => {
          const connectionId = student.connection?.id || student.connection?._id;
          return String(connectionId) === String(action.payload.connectionId)
            ? applyConnectionState(student, defaultConnection)
            : student;
        });
        state.summaryStatus = "idle";
      })
      .addCase(removeConnection.rejected, (state, action) => {
        delete state.actionLoadingByConnectionId[action.meta.arg];
      })
      .addCase(updateConnectionPreferences.pending, (state, action) => {
        state.actionLoadingByConnectionId[action.meta.arg.connectionId] = true;
      })
      .addCase(updateConnectionPreferences.fulfilled, (state, action) => {
        const updatedConnection = action.payload;
        if (updatedConnection?._id) {
          delete state.actionLoadingByConnectionId[updatedConnection._id];
          state.connections = state.connections.map((connection) =>
            String(connection._id) === String(updatedConnection._id) ? updatedConnection : connection
          );
          state.connectionSummary.recentConnections = (state.connectionSummary.recentConnections || []).map((connection) =>
            String(connection._id) === String(updatedConnection._id) ? updatedConnection : connection
          );
        }
      })
      .addCase(updateConnectionPreferences.rejected, (state, action) => {
        delete state.actionLoadingByConnectionId[action.meta.arg?.connectionId];
      })
      .addCase(fetchStudentProfile.pending, (state) => {
        state.selectedStudentProfileStatus = "loading";
        state.selectedStudentProfileError = null;
      })
      .addCase(fetchStudentProfile.fulfilled, (state, action) => {
        state.selectedStudentProfileStatus = "succeeded";
        state.selectedStudentProfile = action.payload;
      })
      .addCase(fetchStudentProfile.rejected, (state, action) => {
        state.selectedStudentProfileStatus = "failed";
        state.selectedStudentProfileError = action.payload || action.error.message;
      });
  },
});

export const { clearSelectedStudentProfile, setConnectionFilters, setDiscoveryFilters } = discoverySlice.actions;
export default discoverySlice.reducer;