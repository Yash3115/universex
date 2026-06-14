import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../services/api";

const ADMIN_ACCOUNTS_ENDPOINT = "/api/users/admin/accounts";
const ADMIN_ACCESS_REQUESTS_ENDPOINT = "/api/users/admin/access-requests";

const buildQuery = (filters = {}) => {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      params.append(key, value);
    }
  });

  const query = params.toString();
  return query ? `?${query}` : "";
};

export const fetchManagedAccounts = createAsyncThunk(
  "adminAccounts/fetchManagedAccounts",
  async (filters = {}, { rejectWithValue }) => {
    try {
      const response = await api.get(`${ADMIN_ACCOUNTS_ENDPOINT}${buildQuery(filters)}`);
      return response.data.users || [];
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const createManagedAccount = createAsyncThunk(
  "adminAccounts/createManagedAccount",
  async (payload, { rejectWithValue }) => {
    try {
      const normalizedPayload = {
        ...payload,
        email: payload.email?.trim().toLowerCase(),
        firstName: payload.firstName?.trim(),
        lastName: payload.lastName?.trim(),
        college: payload.college?.trim(),
        department: payload.department?.trim(),
        graduationYear: payload.graduationYear
          ? Number(payload.graduationYear)
          : undefined,
      };

      const response = await api.post(ADMIN_ACCOUNTS_ENDPOINT, normalizedPayload);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const fetchAccessRequests = createAsyncThunk(
  "adminAccounts/fetchAccessRequests",
  async (filters = {}, { rejectWithValue }) => {
    try {
      const response = await api.get(`${ADMIN_ACCESS_REQUESTS_ENDPOINT}${buildQuery(filters)}`);
      return response.data.requests || [];
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const updateAccessRequestStatus = createAsyncThunk(
  "adminAccounts/updateAccessRequestStatus",
  async ({ requestId, status }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`${ADMIN_ACCESS_REQUESTS_ENDPOINT}/${requestId}`, { status });
      return response.data.request;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const updateManagedAccountActiveStatus = createAsyncThunk(
  "adminAccounts/updateManagedAccountActiveStatus",
  async ({ accountId, active }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`${ADMIN_ACCOUNTS_ENDPOINT}/${accountId}/active`, { active });
      return response.data.user;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const resetManagedAccountPassword = createAsyncThunk(
  "adminAccounts/resetManagedAccountPassword",
  async ({ accountId, password }, { rejectWithValue }) => {
    try {
      const response = await api.post(`${ADMIN_ACCOUNTS_ENDPOINT}/${accountId}/reset-password`, { password });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

const replaceAccount = (accounts, updatedAccount) =>
  accounts.map((account) => (account._id === updatedAccount._id ? updatedAccount : account));

const adminAccountsSlice = createSlice({
  name: "adminAccounts",
  initialState: {
    accounts: [],
    accessRequests: [],
    accessRequestStatus: "idle",
    accessRequestError: null,
    accessRequestActionById: {},
    status: "idle",
    createStatus: "idle",
    error: null,
    createError: null,
    createdAccount: null,
    temporaryPassword: "",
    actionByAccountId: {},
  },
  reducers: {
    clearCreatedAccount: (state) => {
      state.createdAccount = null;
      state.temporaryPassword = "";
      state.createError = null;
      state.createStatus = "idle";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchManagedAccounts.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchManagedAccounts.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.accounts = action.payload;
      })
      .addCase(fetchManagedAccounts.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || action.error.message;
      })
      .addCase(createManagedAccount.pending, (state) => {
        state.createStatus = "loading";
        state.createError = null;
      })
      .addCase(createManagedAccount.fulfilled, (state, action) => {
        state.createStatus = "succeeded";
        state.createdAccount = action.payload.user;
        state.temporaryPassword = action.payload.temporaryPassword || "";
        if (action.payload.user) {
          state.accounts = [
            action.payload.user,
            ...state.accounts.filter((account) => account._id !== action.payload.user._id),
          ];
        }
      })
      .addCase(createManagedAccount.rejected, (state, action) => {
        state.createStatus = "failed";
        state.createError = action.payload || action.error.message;
      })
      .addCase(fetchAccessRequests.pending, (state) => {
        state.accessRequestStatus = "loading";
        state.accessRequestError = null;
      })
      .addCase(fetchAccessRequests.fulfilled, (state, action) => {
        state.accessRequestStatus = "succeeded";
        state.accessRequests = action.payload;
      })
      .addCase(fetchAccessRequests.rejected, (state, action) => {
        state.accessRequestStatus = "failed";
        state.accessRequestError = action.payload || action.error.message;
      })
      .addCase(updateAccessRequestStatus.pending, (state, action) => {
        state.accessRequestActionById[action.meta.arg.requestId] = true;
      })
      .addCase(updateAccessRequestStatus.fulfilled, (state, action) => {
        delete state.accessRequestActionById[action.payload._id];
        state.accessRequests = state.accessRequests.map((request) =>
          request._id === action.payload._id ? action.payload : request
        );
      })
      .addCase(updateAccessRequestStatus.rejected, (state, action) => {
        delete state.accessRequestActionById[action.meta.arg?.requestId];
        state.accessRequestError = action.payload || action.error.message;
      })
      .addCase(updateManagedAccountActiveStatus.pending, (state, action) => {
        state.actionByAccountId[action.meta.arg.accountId] = true;
      })
      .addCase(updateManagedAccountActiveStatus.fulfilled, (state, action) => {
        delete state.actionByAccountId[action.payload._id];
        state.accounts = replaceAccount(state.accounts, action.payload);
      })
      .addCase(updateManagedAccountActiveStatus.rejected, (state, action) => {
        delete state.actionByAccountId[action.meta.arg?.accountId];
        state.error = action.payload || action.error.message;
      })
      .addCase(resetManagedAccountPassword.pending, (state, action) => {
        state.actionByAccountId[action.meta.arg.accountId] = true;
      })
      .addCase(resetManagedAccountPassword.fulfilled, (state, action) => {
        delete state.actionByAccountId[action.payload.user?._id];
        state.createdAccount = action.payload.user;
        state.temporaryPassword = action.payload.temporaryPassword || "";
        if (action.payload.user) {
          state.accounts = replaceAccount(state.accounts, action.payload.user);
        }
      })
      .addCase(resetManagedAccountPassword.rejected, (state, action) => {
        delete state.actionByAccountId[action.meta.arg?.accountId];
        state.error = action.payload || action.error.message;
      });
  },
});

export const { clearCreatedAccount } = adminAccountsSlice.actions;
export default adminAccountsSlice.reducer;
