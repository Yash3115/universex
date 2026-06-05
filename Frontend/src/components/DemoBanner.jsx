import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { FiLogOut, FiRefreshCcw, FiUserPlus } from "react-icons/fi";
import { exitDemoSession } from "../features/auth/authSlice";

const DemoBanner = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);

  if (!user?.isDemo) return null;

  const handleExitDemo = async () => {
    const result = await dispatch(exitDemoSession());
    if (exitDemoSession.fulfilled.match(result)) {
      navigate(result.payload?.restoredUser ? "/dashboard" : "/", { replace: true });
    }
  };

  const handleSwitchRole = async () => {
    const result = await dispatch(exitDemoSession());
    if (exitDemoSession.fulfilled.match(result)) {
      navigate("/demo", { replace: true });
    }
  };

  return (
    <div className="sticky top-[66px] z-30 border-b border-amber-200 bg-amber-50/95 px-4 py-2 text-amber-950 shadow-sm backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-black">Demo Mode - sample data resets regularly</p>
          <p className="text-xs text-amber-800">
            You are exploring fictional sandbox data. Demo activity is disposable.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full bg-amber-900 px-4 py-2 text-xs font-bold text-white transition hover:bg-amber-800"
            onClick={() => navigate("/request-access")}
          >
            <FiUserPlus />
            Create full account
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full border border-amber-300 bg-white px-4 py-2 text-xs font-bold text-amber-950 transition hover:bg-amber-100"
            onClick={handleSwitchRole}
          >
            <FiRefreshCcw />
            Switch role
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full border border-amber-300 bg-white px-4 py-2 text-xs font-bold text-amber-950 transition hover:bg-amber-100"
            onClick={handleExitDemo}
          >
            <FiLogOut />
            Exit demo
          </button>
        </div>
      </div>
    </div>
  );
};

export default DemoBanner;
