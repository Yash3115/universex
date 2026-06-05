import { useEffect, useState } from "react";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { login, startDemoSession } from "../features/auth/authSlice";

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const user = useSelector((state) => state.auth.user);
  const loading = useSelector((state) => state.auth.loading);

  useEffect(() => {
    if (isAuthenticated) {
      navigate(
        user?.mustChangePassword || user?.profileCompletionRequired
          ? "/onboarding"
          : "/dashboard",
        { replace: true }
      );
    }
  }, [isAuthenticated, navigate, user]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: "" }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const validationErrors = {};

    if (!formData.email) validationErrors.email = "Email is required";
    if (!formData.password) validationErrors.password = "Password is required";

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    dispatch(login(formData));
  };

  const handleTryDemo = async () => {
    const result = await dispatch(startDemoSession());
    if (startDemoSession.fulfilled.match(result)) {
      navigate("/dashboard?demo=true");
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-white p-4">
      <section className="flex w-full max-w-4xl flex-col overflow-hidden rounded-lg bg-white text-black shadow-lg md:flex-row">
        <div className="hidden items-center justify-center bg-gray-200 md:flex md:w-1/2">
          <img
            src="/Login.jpg"
            alt="Students using the UniVerseX portal"
            className="h-full w-full object-cover"
          />
        </div>

        <div className="w-full p-8 md:w-1/2">
          <h1 className="text-center text-3xl font-bold text-blue-900">
            Welcome Back
          </h1>
          <p className="mb-6 mt-2 text-center text-lg font-semibold">
            Login to your account
          </p>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="email" className="block text-gray-700">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="mt-1 w-full rounded-lg border border-gray-400 bg-white p-3 text-black shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-500">{errors.email}</p>
              )}
            </div>
            <div className="mb-4">
              <label htmlFor="password" className="block text-gray-700">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-lg border border-gray-400 bg-white p-3 pr-12 text-black shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-4 text-gray-500 hover:text-gray-700"
                  onClick={() => setShowPassword((current) => !current)}
                >
                  {showPassword ? (
                    <AiOutlineEyeInvisible size={20} />
                  ) : (
                    <AiOutlineEye size={20} />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-500">{errors.password}</p>
              )}
            </div>
            <button
              type="submit"
              className="mt-4 w-full rounded-lg bg-blue-600 p-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={loading}
            >
              Login
            </button>
          </form>
          <button
            type="button"
            className="mt-3 w-full rounded-lg border border-blue-200 bg-blue-50 p-3 font-semibold text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={handleTryDemo}
            disabled={loading}
          >
            Try Demo
          </button>
          <p className="mt-4 text-center text-sm leading-6 text-gray-600">
            Need access?{" "}
            <button
              type="button"
              className="font-bold text-blue-700 hover:underline"
              onClick={() => navigate("/request-access")}
            >
              Request a student or professor account.
            </button>
          </p>
        </div>
      </section>
    </main>
  );
};

export default Login;
