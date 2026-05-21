import { Navigate } from "react-router-dom";
import { useAuthStore } from "@/stores/auth.store";

/**
 * Redirects to /login if the user is not authenticated.
 */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const authenticated = useAuthStore((s) => s.authenticated);
  if (authenticated === false) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
