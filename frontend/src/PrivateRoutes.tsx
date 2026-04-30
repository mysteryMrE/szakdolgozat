import { Navigate } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import { type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

/**
 * Protected route component that redirects unauthenticated users to login.
 * @param children - The components to render if user is authenticated.
 * @returns The children if authenticated, otherwise redirects to /login.
 */
const PrivateRoute = ({ children }: Props): ReactNode => {
  const { user, isReady } = useAuth();

  if (!isReady) {
    return null;
  }

  return user ? children : <Navigate to="/login" />;
};

export default PrivateRoute;
