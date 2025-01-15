import { Routes, Route, Navigate} from 'react-router-dom';

import { jwtDecode } from 'jwt-decode';

import Login from './components/Login/Login';
import Register from './components/register/Register';
import NotFound from './components/notFound/NotFound';
import Navbar from './components/navbar/Navbar';

import AdminHome from './components/adminPages/AdminHome';
import WaitingRequests from './components/adminPages/WaitingRequests';
import RequestHistory from './/components/adminPages/RequestHistory';
import GroupData from './components/adminPages/GroupData';
import ManageUsers from './components/adminPages/ManageUsers';

import UserHome from './components/userPages/UserHome';
import ChecksHistory from './components/userPages/ChecksHistory';
import ActiveRequests from './components/userPages/ActiveRequests';
import CheckCode from './components/userPages/CheckCode';
import RunContainers from './components/userPages/RunContainers';

import ProtectedRoute from './components/routeHelpers/ProtectedRoute';
import TokenWrapper from './components/routeHelpers/TokenWrapper';
import { useToken } from './utils/decodingUtils';


const App = (): JSX.Element => {
  const accessToken: string | null = useToken("access");
  const role = accessToken ? jwtDecode<{ role: string }>(accessToken).role : null;

  // Admin links
  const adminLinks = [
    { name: 'Waiting Requests', href: '/admin/waiting-requests' },
    { name: 'Request History', href: '/admin/request-history' },
    { name: 'Group Data', href: '/admin/group-data' },
    { name: 'Manage Users', href: '/admin/manage-users' },
  ];

  // User links
  const userLinks = [
    { name: 'Checks History', href: '/user/checks-history' },
    { name: 'Active Requests', href: '/user/active-requests' },
    { name: 'Check Code', href: '/user/check-code' },
    { name: 'Run Containers', href: '/user/run-containers' },
  ];

  const links: { name: string; href: string; }[] = role === 'admin' ? adminLinks : userLinks;

  return (
    <div>
      {role && <Navbar links={links} />}
      <Routes>
        {/* Public Routes */}
        <Route path="/auth/login" element={<Login />} />
        <Route path="/auth/register" element={<Register />} />

        
        {/* Admin Routes */}
          <Route path="/admin/*" element={
            <TokenWrapper>
              <ProtectedRoute role={role} requiredRole="admin">
                <Routes>
                  <Route path="/home" element={<AdminHome/>} />
                  <Route path="/waiting-requests" element={<WaitingRequests />} />
                  <Route path="/request-history" element={<RequestHistory />} />
                  <Route path="/group-data" element={<GroupData />} />
                  <Route path="/manage-users" element={<ManageUsers />} />
                </Routes>
              </ProtectedRoute>
            </TokenWrapper>
            }
          />

        {/* User Routes */}
          <Route path="/user/*" element={
            <TokenWrapper>
              <ProtectedRoute role={role} requiredRole="user">
                <Routes>
                  <Route path="/home" element={<UserHome/>} /> 
                  <Route path="/checks-history" element={<ChecksHistory />} />
                  <Route path="/active-requests" element={<ActiveRequests />} />
                  <Route path="/check-code" element={<CheckCode />} />
                  <Route path="/run-containers" element={<RunContainers />} />
                </Routes>
              </ProtectedRoute>
            </TokenWrapper>
            }
          />
        
        
        {/* Redirect to login if route does not exist */}
        <Route path="/404" element={<NotFound />} />
        <Route path="*" element={<Navigate to="/auth/login" />} />
      </Routes>
    </div>
  );
};

export default App;
