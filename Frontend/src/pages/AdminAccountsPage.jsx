import { useEffect, useMemo, useState } from "react";
import { FaChalkboardTeacher, FaCopy, FaKey, FaSearch, FaUserPlus, FaUsers } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  clearCreatedAccount,
  createManagedAccount,
  fetchManagedAccounts,
} from "../features/admin/adminAccountsSlice";

const emptyForm = {
  role: "Student",
  firstName: "",
  lastName: "",
  email: "",
  college: "",
  contactNumber: "",
  department: "",
  graduationYear: "",
  gender: "",
  dateOfBirth: "",
  employeeId: "",
  designation: "",
  password: "",
};

const collegeOptions = [
  "NIT Kurukshetra",
  "DTU",
  "NSIT",
  "IIIT Delhi",
  "IIIT Hyderabad",
];

const departmentOptions = [
  "Computer Science",
  "Information Technology",
  "Electronics",
  "Electrical",
  "Mechanical",
  "Civil",
  "Mathematics",
  "Physics",
  "Management",
];

const getProfile = (account) =>
  account?.additionalDetails && typeof account.additionalDetails === "object"
    ? account.additionalDetails
    : {};

const AdminAccountsPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const {
    accounts,
    status,
    createStatus,
    error,
    createError,
    createdAccount,
    temporaryPassword,
  } = useSelector((state) => state.adminAccounts);

  const [formData, setFormData] = useState(emptyForm);
  const [filters, setFilters] = useState({ search: "", role: "", onboarding: "" });
  const [query, setQuery] = useState(filters);
  const isDemoAdmin = Boolean(user?.isDemo);

  useEffect(() => {
    if (user && user.role !== "Admin") {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate, user]);

  useEffect(() => {
    if (user?.role === "Admin") {
      dispatch(fetchManagedAccounts(query));
    }
  }, [dispatch, query, user?.role]);

  const metrics = useMemo(() => {
    const pending = accounts.filter(
      (account) => account.mustChangePassword || account.profileCompletionRequired
    ).length;

    return {
      total: accounts.length,
      students: accounts.filter((account) => account.role === "Student").length,
      professors: accounts.filter((account) => account.role === "Professor").length,
      pending,
    };
  }, [accounts]);

  const updateField = (field, value) => {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const updateFilter = (field, value) => {
    const nextFilters = { ...filters, [field]: value };
    setFilters(nextFilters);
    if (field !== "search") setQuery(nextFilters);
  };

  const handleFilterSubmit = (event) => {
    event.preventDefault();
    setQuery(filters);
  };

  const handleResetFilters = () => {
    const nextFilters = { search: "", role: "", onboarding: "" };
    setFilters(nextFilters);
    setQuery(nextFilters);
  };

  const handleCreateAccount = async (event) => {
    event.preventDefault();

    if (isDemoAdmin) {
      toast.info("Demo admin can view demo accounts but cannot create accounts.");
      return;
    }

    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.email.trim() || !formData.college.trim()) {
      toast.error("First name, last name, email, and college are required.");
      return;
    }

    try {
      const result = await dispatch(createManagedAccount(formData)).unwrap();
      toast.success(result.message || "Account created");
      setFormData((current) => ({
        ...emptyForm,
        role: current.role,
        college: current.college,
        department: current.department,
      }));
      setQuery((current) => ({ ...current }));
    } catch (message) {
      toast.error(message || "Unable to create account");
    }
  };

  const handleCopyPassword = async () => {
    try {
      await navigator.clipboard.writeText(temporaryPassword);
      toast.success("Temporary password copied");
    } catch {
      toast.error("Copy failed. Select and copy the password manually.");
    }
  };

  if (!user || user.role !== "Admin") {
    return (
      <main className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-4xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="font-semibold text-slate-600">Checking admin access...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col gap-4 border-b border-slate-200 pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-blue-700">
              Account provisioning
            </p>
            <h1 className="mt-2 text-3xl font-black text-slate-950 sm:text-4xl">
              Create student and professor accounts
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
              Admins create accounts, share the temporary password, and the user
              completes password reset and profile setup on first login.
            </p>
          </div>
          <button
            type="button"
            className="btn rounded-xl bg-white"
            onClick={() => dispatch(fetchManagedAccounts(query))}
          >
            Refresh
          </button>
        </header>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Account summary">
          {[
            ["Total", metrics.total, FaUsers, "text-blue-700"],
            ["Students", metrics.students, FaUsers, "text-emerald-700"],
            ["Professors", metrics.professors, FaChalkboardTeacher, "text-violet-700"],
            ["Setup required", metrics.pending, FaKey, "text-amber-700"],
          ].map(([label, value, Icon, color]) => (
            <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 ${color}`}>
                <Icon aria-hidden="true" />
              </div>
              <p className="mt-4 text-2xl font-black text-slate-950">{value}</p>
              <p className="text-sm font-semibold text-slate-500">{label}</p>
            </div>
          ))}
        </section>

        <div className="grid gap-6 xl:grid-cols-[24rem_1fr]">
          <section className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                <FaUserPlus aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-xl font-black text-slate-950">New account</h2>
                <p className="text-sm text-slate-500">
                  {isDemoAdmin ? "Disabled in demo mode" : "Student or professor only"}
                </p>
              </div>
            </div>

            {isDemoAdmin && (
              <p className="mt-5 rounded-xl bg-amber-50 p-3 text-sm font-semibold text-amber-800">
                Demo admin is read-only. Real account creation is available only outside demo mode.
              </p>
            )}

            <form className="mt-5 space-y-4" onSubmit={handleCreateAccount}>
              <label className="block">
                <span className="text-sm font-bold text-slate-700">Role</span>
                <select
                  className="select select-bordered mt-1 w-full rounded-xl"
                  value={formData.role}
                  onChange={(event) => updateField("role", event.target.value)}
                >
                  <option value="Student">Student</option>
                  <option value="Professor">Professor</option>
                </select>
              </label>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-bold text-slate-700">First name</span>
                  <input
                    className="input input-bordered mt-1 w-full rounded-xl"
                    value={formData.firstName}
                    onChange={(event) => updateField("firstName", event.target.value)}
                    required
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-bold text-slate-700">Last name</span>
                  <input
                    className="input input-bordered mt-1 w-full rounded-xl"
                    value={formData.lastName}
                    onChange={(event) => updateField("lastName", event.target.value)}
                    required
                  />
                </label>
              </div>

              <label className="block">
                <span className="text-sm font-bold text-slate-700">Email</span>
                <input
                  className="input input-bordered mt-1 w-full rounded-xl"
                  type="email"
                  value={formData.email}
                  onChange={(event) => updateField("email", event.target.value)}
                  required
                />
              </label>

              <label className="block">
                <span className="text-sm font-bold text-slate-700">College</span>
                <input
                  className="input input-bordered mt-1 w-full rounded-xl"
                  list="college-options"
                  value={formData.college}
                  onChange={(event) => updateField("college", event.target.value)}
                  required
                />
                <datalist id="college-options">
                  {collegeOptions.map((college) => (
                    <option key={college} value={college} />
                  ))}
                </datalist>
              </label>

              <label className="block">
                <span className="text-sm font-bold text-slate-700">Department</span>
                <input
                  className="input input-bordered mt-1 w-full rounded-xl"
                  list="department-options"
                  value={formData.department}
                  onChange={(event) => updateField("department", event.target.value)}
                />
                <datalist id="department-options">
                  {departmentOptions.map((department) => (
                    <option key={department} value={department} />
                  ))}
                </datalist>
              </label>

              {formData.role === "Student" ? (
                <label className="block">
                  <span className="text-sm font-bold text-slate-700">Graduation year</span>
                  <input
                    className="input input-bordered mt-1 w-full rounded-xl"
                    type="number"
                    min="2000"
                    max="2100"
                    value={formData.graduationYear}
                    onChange={(event) => updateField("graduationYear", event.target.value)}
                  />
                </label>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                  <label className="block">
                    <span className="text-sm font-bold text-slate-700">Employee ID</span>
                    <input
                      className="input input-bordered mt-1 w-full rounded-xl"
                      value={formData.employeeId}
                      onChange={(event) => updateField("employeeId", event.target.value)}
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm font-bold text-slate-700">Designation</span>
                    <input
                      className="input input-bordered mt-1 w-full rounded-xl"
                      value={formData.designation}
                      onChange={(event) => updateField("designation", event.target.value)}
                      placeholder="Assistant Professor"
                    />
                  </label>
                </div>
              )}

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-bold text-slate-700">Contact number</span>
                  <input
                    className="input input-bordered mt-1 w-full rounded-xl"
                    value={formData.contactNumber}
                    onChange={(event) => updateField("contactNumber", event.target.value)}
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-bold text-slate-700">Temporary password</span>
                  <input
                    className="input input-bordered mt-1 w-full rounded-xl"
                    type="text"
                    value={formData.password}
                    onChange={(event) => updateField("password", event.target.value)}
                    placeholder="Auto-generate"
                    minLength={8}
                  />
                </label>
              </div>

              <button
                type="submit"
                className="btn btn-primary w-full rounded-xl"
                disabled={isDemoAdmin || createStatus === "loading"}
              >
                {isDemoAdmin ? "Creation disabled in demo" : createStatus === "loading" ? "Creating..." : "Create account"}
              </button>
              {createError && (
                <p className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">
                  {createError}
                </p>
              )}
            </form>

            {createdAccount && temporaryPassword && (
              <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4" aria-live="polite">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-black text-amber-900">
                      Temporary password
                    </p>
                    <p className="mt-1 text-sm text-amber-800">
                      Share this once with {createdAccount.firstName}. They must
                      change it after login.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn btn-sm rounded-xl bg-white"
                    onClick={handleCopyPassword}
                  >
                    <FaCopy aria-hidden="true" />
                    Copy
                  </button>
                </div>
                <code className="mt-3 block select-all rounded-xl bg-white px-3 py-2 text-sm font-black text-slate-950">
                  {temporaryPassword}
                </code>
                <button
                  type="button"
                  className="mt-3 text-sm font-bold text-amber-900 hover:underline"
                  onClick={() => dispatch(clearCreatedAccount())}
                >
                  Dismiss password
                </button>
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-xl font-black text-slate-950">Managed accounts</h2>
                <p className="text-sm text-slate-500">
                  Latest student and professor accounts created for login-only access.
                </p>
              </div>
              <form className="grid gap-2 sm:grid-cols-[1fr_9rem_10rem_auto_auto]" onSubmit={handleFilterSubmit}>
                <label className="relative block">
                  <span className="sr-only">Search accounts</span>
                  <FaSearch className="pointer-events-none absolute left-3 top-3.5 text-slate-400" aria-hidden="true" />
                  <input
                    className="input input-bordered w-full rounded-xl pl-10"
                    value={filters.search}
                    onChange={(event) => updateFilter("search", event.target.value)}
                    placeholder="Search"
                  />
                </label>
                <label className="block">
                  <span className="sr-only">Role filter</span>
                  <select
                    className="select select-bordered w-full rounded-xl"
                    value={filters.role}
                    onChange={(event) => updateFilter("role", event.target.value)}
                  >
                    <option value="">All roles</option>
                    <option value="Student">Students</option>
                    <option value="Professor">Professors</option>
                  </select>
                </label>
                <label className="block">
                  <span className="sr-only">Onboarding filter</span>
                  <select
                    className="select select-bordered w-full rounded-xl"
                    value={filters.onboarding}
                    onChange={(event) => updateFilter("onboarding", event.target.value)}
                  >
                    <option value="">All setup</option>
                    <option value="required">Setup required</option>
                  </select>
                </label>
                <button type="submit" className="btn rounded-xl bg-slate-100">
                  Search
                </button>
                <button type="button" className="btn rounded-xl bg-white" onClick={handleResetFilters}>
                  Clear
                </button>
              </form>
            </div>

            {error && (
              <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">
                {error}
              </p>
            )}

            <div className="mt-5 overflow-x-auto">
              <table className="table">
                <thead>
                  <tr className="text-slate-600">
                    <th>Name</th>
                    <th>Role</th>
                    <th>Department</th>
                    <th>College</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {status === "loading" && (
                    <tr>
                      <td colSpan="5" className="py-8 text-center font-semibold text-slate-500">
                        Loading accounts...
                      </td>
                    </tr>
                  )}
                  {status !== "loading" && accounts.length === 0 && (
                    <tr>
                      <td colSpan="5" className="py-8 text-center font-semibold text-slate-500">
                        No managed accounts found.
                      </td>
                    </tr>
                  )}
                  {status !== "loading" &&
                    accounts.map((account) => {
                      const profile = getProfile(account);
                      const faculty = account.facultyProfile || {};
                      const department = profile.department || faculty.department || "Not set";
                      const needsSetup = account.mustChangePassword || account.profileCompletionRequired;
                      const statusLabel = account.active === false
                        ? "Inactive"
                        : needsSetup
                          ? "Setup required"
                          : "Ready";

                      return (
                        <tr key={account._id}>
                          <td>
                            <div className="font-black text-slate-950">
                              {account.firstName} {account.lastName}
                            </div>
                            <div className="text-sm text-slate-500">{account.email}</div>
                          </td>
                          <td>
                            <span className="badge badge-outline rounded-lg">
                              {account.role}
                            </span>
                          </td>
                          <td>{department}</td>
                          <td>{account.college}</td>
                          <td>
                            <span
                              className={`badge rounded-lg ${
                                account.active === false
                                  ? "badge-error"
                                  : needsSetup
                                    ? "badge-warning"
                                    : "badge-success"
                              }`}
                            >
                              {statusLabel}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
};

export default AdminAccountsPage;
