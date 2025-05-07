import React, { useState, useEffect} from "react";
import axios from 'axios';
import { useTokenProperty, useToken } from "../../utils/decodingUtils";
import "./groupData.css";
import { User } from "../types/groupDataTypes";
import { PieChart, Pie, Cell, Tooltip, Legend} from "recharts";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFaceFrown } from '@fortawesome/free-solid-svg-icons';
import { faUsers } from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-toastify';

const COLORS = ["#66a68b", "#ff4d4d"];

const GroupData: React.FC = () => { 

  const [groupCode, setGroupCode] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [stats, setStats] = useState<{ approved: number; disapproved: number }>({ approved: 0, disapproved: 0 });
  const [lastUpdated, setLastUpdated] = useState<string>("");

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
      setStats({ approved: res.data.approved, disapproved: res.data.disapproved });
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
    { name: "Approved", value: stats.approved },
    { name: "Disapproved", value: stats.disapproved },
  ];

  return (
      <div className="group-container">
        <div className="left-pane">
          <h1 className="group-code">Group Code: {groupCode || "Loading..."}</h1>
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-bar"
          />
          {filteredUsers.length === 0 ? (
            <p className="no-users">
            <FontAwesomeIcon icon={faUsers} size="4x" style={{ marginRight: '8px', color: '#ff4d4d' }} /> <br/>
            No users in this group yet
          </p>
          ) : (
          <table className="user-table">
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
                    <button className="remove-button" onClick={() => handleRemoveClick(user)}>Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          )}
        </div>

        <div className="right-pane">
        <div className="chart-header">
          <h2 className="chart-title">API Codes Group Stats</h2>
          <div className="chart-controls">
            <button className="refresh-button" onClick={fetchGroupStats}>🔄 Refresh</button>
            <span className="updated-time">Last updated at: {lastUpdated}</span>
          </div>
        </div>
        {stats.approved === 0 && stats.disapproved === 0 ? (
          <p className="no-stats">
          <FontAwesomeIcon icon={faFaceFrown} size="2x" style={{ marginRight: '8px', color: '#66a68b' }} /><br/>
          No stats yet
        </p>
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
      </div>
      {showPopup && selectedUser && (
          <div className="gd-popup-overlay">
            <div className="gd-popup-container">
              <h2>ARE YOU SURE YOU WANT TO REMOVE <span className="gd-highlight">{selectedUser.username}</span>?</h2>
              <p>This action can't be undone!</p>

              <input
                type="password"
                placeholder="Enter admin authorization code"
                value={adminCode}
                onChange={(e) => setAdminCode(e.target.value)}
                className="gd-auth-code-input"
              />
              {authError && <p className="gd-error-text">{authError}</p>}

              <div className="gd-popup-buttons">
                <button
                  className="gd-confirm-remove-button"
                  onClick={() => handleRemoveUser(selectedUser._id)}
                  disabled={!adminCode}
                >
                  Remove
                </button>
                <button className="gd-cancel-button" onClick={() => setShowPopup(false)}>Cancel</button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
};
  
  export default GroupData;