import React, { useState, useEffect} from "react";
import axios from 'axios';
import { useTokenProperty, useToken } from "../../utils/decodingUtils";
import "./groupData.css";
import { User } from "../types/groupDataTypes";
import { PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer} from "recharts";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFaceFrown, faUsers, faCopy } from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-toastify';

const COLORS = ["#66a68b", "#ff4d4d"];

const GroupData: React.FC = () => { 

  const [groupCode, setGroupCode] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [lastUpdated, setLastUpdated] = useState<string>("");

  const [stats, setStats] = useState<any>({
    groupSummary: {},
    userStats: []
  });


  const [showPopup, setShowPopup] = useState<boolean>(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [adminCode, setAdminCode] = useState<string>("");
  const [authError, setAuthError] = useState<string>("");

  const accessToken: string = useToken("access")!;
  const userId: string = useTokenProperty("userId");

  useEffect(() => {
    const newUser = localStorage.getItem("pendingNewUserToast");
    if (newUser) {
      toast.info(`New user joined: ${newUser}`);
      localStorage.removeItem("pendingNewUserToast");
    }
  }, []);

  useEffect(() => {
    if (showPopup) {
      document.body.classList.add('no-scroll');
    } else {
      document.body.classList.remove('no-scroll');
    }
    return () => document.body.classList.remove('no-scroll');
  }, [showPopup]);

  const fetchGroupData = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await axios.get(
        `http://localhost:3000/admin/${userId}/group-data`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      setGroupCode(response.data.adminGroupCode);
      setUsers(response.data.users);
    } catch {
      setError("Failed to fetch group data. Please try again.");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchGroupStats = async () => {
    try {
      const res = await axios.get(`http://localhost:3000/admin/${userId}/group-stats`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setStats(res.data);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch {
      console.error("Failed to fetch group stats");
    }
  };

  const handleRemoveClick = (user: User) => {
    setSelectedUser(user);
    setShowPopup(true);
    setAdminCode("");
    setAuthError("");
  };

  const handleRemoveUser = async (uid: string) => {
    try {
      const response = await axios.delete(`http://localhost:3000/admin/${userId}/remove-user/${uid}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        data: {adminCode}
      });
      if (response.status === 200) {
        setUsers((prev) => prev.filter((u) => u._id !== uid));
        fetchGroupStats();
        setShowPopup(false);
        toast.success(`${selectedUser?.username} REMOVED Successfuly.`)
      }
    } catch (error: any) {
      setAuthError(error.response?.data?.message || "Failed to remove user");
    }
  };

  useEffect(() => {
    fetchGroupData();
    fetchGroupStats();
  }, [userId, accessToken]);

  useEffect(() => {
    const refreshHandler = () => {
      fetchGroupData();
      fetchGroupStats();
    };
  
    window.addEventListener("refreshGroupData", refreshHandler);
  
    return () => {
      window.removeEventListener("refreshGroupData", refreshHandler);
    };
  }, []);

  const filteredUsers = users.filter((u) => u.username.toLowerCase().includes(searchTerm.toLowerCase()));
  const pieData = [
    { name: "Approved", value: stats.groupSummary?.approved || 0 },
    { name: "Disapproved", value: stats.groupSummary?.disapproved || 0 },
  ];

  const total = stats.groupSummary?.totalRequests || 0;
  const toPercent = (num: number) => total ? `${num} [${Math.round((num / total) * 100)}%]` : `${num} [0%]`;

  return (
      <div className="group-data-container">
        <div className="group-data-left-pane">
        <div className="group-data-code-wrapper">
          <h1 className="group-data-code">Group Code: {groupCode || "Loading..."}</h1>
          <button
            className="group-data-copy-button"
            title="Copy Group Code"
            onClick={() => {
              navigator.clipboard.writeText(groupCode);
              toast.success("Group code copied to clipboard!");
            }}
          >
            <FontAwesomeIcon icon={faCopy} />
          </button>
          </div>
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="group-data-search-bar"
          />
          {filteredUsers.length === 0 ? (
            <p className="group-data-no-users">
            <FontAwesomeIcon icon={faUsers} size="4x" style={{ marginRight: '8px', color: '#ff4d4d' }} /> <br/>
            No users in this group yet
          </p>
          ) : (
          <table className="group-data-user-table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user._id}>
                  <td>{user.username}</td>
                  <td>
                    <button className="group-data-remove-button" onClick={() => handleRemoveClick(user)}>Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          )}
        </div>

        <div className="group-data-right-pane">
        <div className="group-data-chart-header">
          <h2 className="group-data-chart-title">API Codes Group Stats</h2>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {(stats.groupSummary?.totalRequests ?? 0) === 0 ? (
            <div className="group-data-no-stats-wrapper">
              <div className="group-data-no-stats">
                <FontAwesomeIcon icon={faFaceFrown} size="3x" style={{ color: '#66a68b', marginBottom: '0.5rem' }} />
                <p>No stats yet</p>
              </div>
            </div>
          ) : (
            <PieChart width={450} height={350}>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend verticalAlign="bottom" align="center" height={36} />
            </PieChart>
          )}

          <div className="group-data-summary-box">
      <h3 className="group-data-summary-title">Group Summary</h3>
      <ul className="group-data-summary-list">
        <li><span>Total Requests</span><span>{total}</span></li>
        <li><span>Average Confidence</span><span>{stats.groupSummary?.avgConfidence || 0}</span></li>
        <li><span>Model-Admin Agreement</span><span>{toPercent(stats.groupSummary?.modelAdminAgreement || 0)}</span></li>
        <li><span>Total Valid</span><span>{toPercent(stats.groupSummary?.totalValid || 0)}</span></li>
        <li><span>Total Invalid</span><span>{toPercent(stats.groupSummary?.totalInvalid || 0)}</span></li>
      </ul>
    </div>

    {stats.groupSummary?.totalRequests > 0 && (
      <div className="group-data-bar-chart">
        <h3 className="group-data-bar-title">User Confidence Overview</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={stats.userStats} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="username" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="avgConfidence" fill="#66a68b" name="Avg Confidence" />
            <Bar dataKey="total" fill="#8884d8" name="Total Requests" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    )}
        </div>
      </div>
      {showPopup && selectedUser && (
          <div className="group-data-popup-overlay">
            <div className="group-data-popup-container">
              <h2>ARE YOU SURE YOU WANT TO REMOVE <span className="group-data-highlight">{selectedUser.username}</span>?</h2>
              <p>This action can't be undone!</p>

              <input
                type="password"
                placeholder="Enter admin authorization code"
                value={adminCode}
                onChange={(e) => setAdminCode(e.target.value)}
                className="group-data-auth-code-input"
              />
              {authError && <p className="group-data-error-text">{authError}</p>}

              <div className="group-data-popup-buttons">
                <button
                  className="group-data-confirm-remove-button"
                  onClick={() => handleRemoveUser(selectedUser._id)}
                  disabled={!adminCode}
                >
                  Remove
                </button>
                <button className="group-data-cancel-button" onClick={() => setShowPopup(false)}>Cancel</button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
};
  
  export default GroupData;