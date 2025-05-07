import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getSocket } from '../../socket/socket';
import { clearTokens } from '../../store/authSlice';
import { useToken } from '../../utils/decodingUtils';
import { jwtDecode } from 'jwt-decode';

const SocketListener = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const accessToken = useToken("access");

  useEffect(() => {
    if (!accessToken) return;

    let role: string | undefined;
    try {
      role = jwtDecode<{ role: string }>(accessToken).role;
    } catch (err) {
      console.error("Failed to decode token in SocketListener:", err);
      return;
    }
    const socket = getSocket();
    if (!socket || !accessToken) return;

    // === USER EVENTS === 
    const handleUserRemoved = () => {
      dispatch(clearTokens());
      toast.info("Admin removed you");
      navigate("/auth/login");
    };

    const handleRequestChecked = (data: { requestId: string; requestName: string }) => {
      const currentPath = window.location.pathname;

      if (currentPath.includes("/user/active-requests")) {
        window.dispatchEvent(new CustomEvent("removeActiveRequest", { detail: data.requestId }));
        toast.info(`The request - ${data.requestName}, was reviewed and returned by the admin.`);
      } else {
        localStorage.setItem("pendingRemovedRequestName", data.requestName);
      }

      if (currentPath.includes("/user/checks-history")) {
        window.dispatchEvent(new Event("refreshHistory"));
        toast.info("You have 1 check added to history.");
      } else {
        const existing = parseInt(localStorage.getItem("pendingHistoryCount") || "0", 10);
        localStorage.setItem("pendingHistoryCount", String(existing + 1));
      }
    };

    // === ADMIN EVENTS ===
    const handleNewUser = (data: { username: string }) => {
      const currentPath = window.location.pathname;

      if (currentPath.includes("/admin/group-data")) {
        window.dispatchEvent(new Event("refreshGroupData"));
        toast.info(`New user joined: ${data.username}`);
      } else {
        localStorage.setItem("pendingNewUserToast", data.username);
      }
    };

    const handleNewWaitingRequest = (data: { username: string }) => {
      const currentPath = window.location.pathname;

      if (currentPath.includes("/admin/waiting-requests")) {
        window.dispatchEvent(new Event("refreshWaitingRequests"));
        toast.info(`New request from: ${data.username}`);
      } else {
        localStorage.setItem("pendingNewRequestToast", data.username);
      }
    };

    // === OFF existing events ===
    socket.off("userRemoved");
    socket.off("newUserRegistered");
    socket.off("newWaitingRequest");
    socket.off("requestChecked");

    if (role === "user") {
      socket.on("userRemoved", handleUserRemoved);
      socket.on("requestChecked", handleRequestChecked);
    }

    if (role === "admin") {
      socket.on("newUserRegistered", handleNewUser);
      socket.on("newWaitingRequest", handleNewWaitingRequest);
    }

    return () => {
      socket.off("userRemoved", handleUserRemoved);
      socket.off("newUserRegistered", handleNewUser);
      socket.off("newWaitingRequest", handleNewWaitingRequest);
      socket.off("requestChecked", handleRequestChecked);
    };
  }, [accessToken, dispatch, navigate]);

  return null; // This component doesn't render anything
};

export default SocketListener;

