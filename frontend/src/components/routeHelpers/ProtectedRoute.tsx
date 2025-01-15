import { Navigate } from "react-router-dom";
import { useDispatch} from "react-redux";
import { logoutUser } from "../../utils/authUtils";
import { useToken } from "../../utils/decodingUtils";
import { AppDispatch } from "../../store/store";

interface ProtectedRouteProps {
    role: string | null;  // The current user's role (null if not logged in)
    requiredRole: 'admin' | 'user';  // The required role for the route
    children: JSX.Element;  // The children elements (the actual route components)
  }
  
  const ProtectedRoute = ({ role, requiredRole, children }: ProtectedRouteProps) => {
    const dispatch: AppDispatch = useDispatch();
    const accessToken: string = useToken("access")!;
    const refreshToken: string = useToken("refresh")!;
    if (role === requiredRole) {
      console.log('pr: redirecting from protected route');
      return children;
    }
    if (accessToken && refreshToken) {
      logoutUser(dispatch, accessToken, refreshToken); // Call the shared logout function
    }
    console.log('pr: redirecting from protected route to login');
    return <Navigate to="/auth/login" />;
  };

  export default ProtectedRoute;