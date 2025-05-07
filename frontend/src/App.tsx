import { Routes, Route, Navigate, useLocation} from 'react-router-dom';
import { useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useSelector } from 'react-redux';
import { RootState } from './store/store';

import Login from './components/Login/Login';
import Register from './components/register/Register';
import NotFound from './components/notFound/NotFound';
import Navbar from './components/navbar/Navbar';

//user & admin "shared" pages
import Home from './components/Home';

// admin pages
import WaitingRequests from './components/adminPages/WaitingRequests';
import RequestHistory from './/components/adminPages/RequestHistory';
import GroupData from './components/adminPages/GroupData';

// user pages
import ChecksHistory from './components/userPages/ChecksHistory';
import ActiveRequests from './components/userPages/ActiveRequests';
import CheckCode from './components/userPages/CheckCode';
import ManageContainers from './components/userPages/ManageContainers';

import ProtectedRoute from './components/routeHelpers/ProtectedRoute';
import TokenWrapper from './components/routeHelpers/TokenWrapper';
import { useToken } from './utils/decodingUtils';

import { ToastContainer } from 'react-toastify';
import { connectSocket } from './socket/socket';
import SocketListener from './components/socket/SocketListener';

type Role = 'admin' | 'user';
const App = (): JSX.Element => {
  const accessToken: string | null = useToken("access");
  const role: Role | null = useSelector((state: RootState) => state.auth.role) as Role | null;
  const userId = accessToken ? jwtDecode<{ userId: string }>(accessToken).userId : null;

  const location = useLocation();
  const isAuthPage = location.pathname.startsWith('/auth');

  useEffect(() => {
    if (userId) {
      connectSocket(userId);
    }
  }, [userId]);

  // Admin links
  const adminLinks = [
    { name: 'Waiting Requests', href: '/admin/waiting-requests' },
    { name: 'Request History', href: '/admin/request-history' },
    { name: 'Group Data', href: '/admin/group-data' },
  ];

  // User links
  const userLinks = [
    { name: 'Checks History', href: '/user/checks-history' },
    { name: 'Active Requests', href: '/user/active-requests' },
    { name: 'Check Code', href: '/user/check-code' },
    { name: 'Manage Containers', href: '/user/manage-containers'}
  ];

  const links: { name: string; href: string; }[] = role === 'admin' ? adminLinks : userLinks;

  return (
    <div className="layout-container">
      <SocketListener />
      {!isAuthPage && role && <Navbar links={links} />}
      <ToastContainer theme="colored" position="top-center" autoClose={5000} />

      <Routes>
        <Route path="/auth/login" element={<Login />} />
        <Route path="/auth/register" element={<Register />} />

        {/* All protected routes go inside TokenWrapper */}
        <Route
          path="/*"
          element={
            <TokenWrapper>
              <Routes>
                <Route path="/home" element={<ProtectedRoute requiredRole={['admin', 'user']}><Home /></ProtectedRoute>} />

                <Route path="/admin/waiting-requests" element={<ProtectedRoute requiredRole="admin"><WaitingRequests /></ProtectedRoute>} />
                <Route path="/admin/request-history" element={<ProtectedRoute requiredRole="admin"><RequestHistory /></ProtectedRoute>} />
                <Route path="/admin/group-data" element={<ProtectedRoute requiredRole="admin"><GroupData /></ProtectedRoute>} />

                <Route path="/user/checks-history" element={<ProtectedRoute requiredRole="user"><ChecksHistory /></ProtectedRoute>} />
                <Route path="/user/active-requests" element={<ProtectedRoute requiredRole="user"><ActiveRequests /></ProtectedRoute>} />
                <Route path="/user/check-code" element={<ProtectedRoute requiredRole="user"><CheckCode /></ProtectedRoute>} />
                <Route path="/user/manage-containers" element={<ProtectedRoute requiredRole="user"><ManageContainers /></ProtectedRoute>} />

                <Route path="/404" element={<NotFound />} />
                <Route path="*" element={<Navigate to="/auth/login" />} />
              </Routes>
            </TokenWrapper>
          }
        />
      </Routes>
    </div>
  );
};

export default App;
