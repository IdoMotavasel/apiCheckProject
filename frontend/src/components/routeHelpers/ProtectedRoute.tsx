import { Navigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logoutUser } from "../../utils/authUtils";
import { useToken } from "../../utils/decodingUtils";
import { AppDispatch, RootState } from "../../store/store";

type Role = "admin" | "user";

interface ProtectedRouteProps {
  requiredRole: Role | Role[];
  children: JSX.Element;
}

const ProtectedRoute = ({ requiredRole, children }: ProtectedRouteProps) => {
  const dispatch: AppDispatch = useDispatch();
  const accessToken = useToken("access");
  const refreshToken = useToken("refresh");

  console.log("access token: ",accessToken);
  console.log("refresh token: ",refreshToken);

  const role = useSelector((state: RootState) => state.auth.role) as Role | null;
  console.log("role: ",role);

  const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];

  if (role && allowedRoles.includes(role)) {
    return children;
  }

  console.log("after first if");

  if (!role && accessToken && refreshToken) {
    logoutUser(dispatch, accessToken, refreshToken);
  }

  console.log("after second if");

  console.log("ProtectedRoute: Unauthorized, redirecting to login");
  return <Navigate to="/auth/login" />;
};

export default ProtectedRoute;
