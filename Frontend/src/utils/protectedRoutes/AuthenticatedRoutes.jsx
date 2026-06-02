import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

const AuthenticatedRoutes = ({ children }) => {
  const { isAuthenticated, loading, user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const location = useLocation();
  const [initialCheck, setInitialCheck] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        navigate("/login", { replace: true });
      } else if (
        user &&
        (user.mustChangePassword || user.profileCompletionRequired) &&
        location.pathname !== "/onboarding"
      ) {
        navigate("/onboarding", { replace: true });
      } else {
        setInitialCheck(true);
      }
    }
  }, [isAuthenticated, loading, location.pathname, navigate, user]);

  if (loading || !initialCheck) return null; // Prevent flickering

  return children;
};

export default AuthenticatedRoutes;
