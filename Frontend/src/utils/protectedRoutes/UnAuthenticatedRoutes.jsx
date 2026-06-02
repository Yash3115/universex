import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

const UnAuthenticatedRoutes = ({ children }) => {
  const { isAuthenticated, loading, user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const [initialCheck, setInitialCheck] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (isAuthenticated) {
        navigate(user?.mustChangePassword || user?.profileCompletionRequired ? "/onboarding" : "/dashboard", { replace: true });
      } else {
        setInitialCheck(true);
      }
    }
  }, [isAuthenticated, loading, navigate, user]);

  if (loading || !initialCheck) return null; // Prevent flickering

  return !isAuthenticated ? children : null;
};

export default UnAuthenticatedRoutes;
