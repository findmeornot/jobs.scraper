import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "@/stores/auth.store";
import { useAuthCheck } from "@/hooks/use-auth";

/**
 * Runs GET /api/auth/me once on mount via TanStack Query.
 * Syncs the result into the Zustand store and redirects
 * unauthenticated users to /login.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { authenticated, setAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const { data, isSuccess, isError } = useAuthCheck();

  useEffect(() => {
    if (isSuccess) {
      setAuthenticated(data.authenticated);
      if (!data.authenticated && location.pathname !== "/login") {
        navigate("/login", { replace: true });
      }
    }
    // Network-level failure — treat as unauthenticated
    if (isError) {
      setAuthenticated(false);
      if (location.pathname !== "/login") navigate("/login", { replace: true });
    }
  }, [isSuccess, isError, data, location.pathname, navigate, setAuthenticated]);

  // Render nothing while the session check is in-flight
  if (authenticated === null) return null;

  return <>{children}</>;
}
