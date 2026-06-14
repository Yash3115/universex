import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

const RoleRoute = ({ allowedRoles = [], children, fallbackPath = "/dashboard" }) => {
  const navigate = useNavigate();
  const { loading, user } = useSelector((state) => state.auth);

  if (loading) return null;

  const isAllowed = user?.role && allowedRoles.includes(user.role);
  if (!isAllowed) {
    return (
      <main className="min-h-screen bg-slate-50 p-6">
        <section className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="text-sm font-black uppercase tracking-wide text-red-600">Restricted area</p>
          <h1 className="mt-2 text-2xl font-black text-slate-950">You do not have access to this page.</h1>
          <p className="mt-2 text-sm text-slate-500">Open a workspace available for your account role.</p>
          <button type="button" className="btn btn-primary mt-5 rounded-xl" onClick={() => navigate(fallbackPath, { replace: true })}>
            Go to dashboard
          </button>
        </section>
      </main>
    );
  }

  return children;
};

export default RoleRoute;
