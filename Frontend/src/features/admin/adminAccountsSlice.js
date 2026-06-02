import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../services/api";

const ADMIN_ACCOUNTS_ENDPOINT = "/api/users/admin/accounts";

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

const adminAccountsSlice = createSlice({
  name: "adminAccounts",
  initialState: {
    accounts: [],
    status: "idle",
    createStatus: "idle",
    error: null,
    createError: null,
    createdAccount: null,
    temporaryPassword: "",
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
      });
  },
});

export const { clearCreatedAccount } = adminAccountsSlice.actions;
export default adminAccountsSlice.reducer;
