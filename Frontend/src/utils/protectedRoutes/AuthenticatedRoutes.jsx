import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

const AuthenticatedRoutes = ({ children }) => {
  const { isAuthenticated, loading } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const [initialCheck, setInitialCheck] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        navigate("/login", { replace: true });
      } else {
        setInitialCheck(true);
      }
    }
  }, [isAuthenticated, loading, navigate]);

  if (loading || !initialCheck) return null; // Prevent flickering

  return children;
};

export default AuthenticatedRoutes;
