import React, { useState, useEffect} from "react";
import axios from 'axios';
import { useTokenProperty, useToken } from "../../utils/decodingUtils";
import "./groupData.css";
import { User } from "../types/groupDataTypes";

const GroupData: React.FC = () => {
  const [groupCode, setGroupCode] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const accessToken: string = useToken("access")!;
  const userId: string = useTokenProperty("userId");

  useEffect(() => {
    const fetchGroupData = async () => {
      setLoading(true);
      setError("");
      try {
        if(userId){
          const response = await axios.get(
            `http://localhost:3000/getGroupData:${userId}`,
            {
              headers: { Authorization: `Bearer ${accessToken}` },
            }
          );
          setGroupCode(response.data.adminGroupCode);
          setUsers(response.data.users);
        }
        
      } catch (error: any) {
        setError("Failed to fetch group data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchGroupData();
  },);

  const handleRemoveUser = async (username: string): Promise<void> => {
    try {
      await axios.delete(`http://localhost:3000/removeUser`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        data: { username },
      });
      setUsers((prevUsers) =>
        prevUsers.filter((user) => user.username !== username)
      );
    } catch (error) {
      setError("Failed to remove user. Please try again.");
    }
  };

  const filteredUsers: User[] = users.filter((user) =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );
    return (
      <div className="container">
      <h1>Group Code: {groupCode || "Loading..."}</h1>
      {loading ? (
        <p>Loading group data...</p>
      ) : error ? (
        <p className="error">{error}</p>
      ) : (
        <>
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="searchBar"
          />
          <table className="table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Valid Codes Submitted</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.username}>
                  <td>{user.username}</td>
                  <td>{user.validCodes}</td>
                  <td>
                    <button
                      onClick={() => handleRemoveUser(user.username)}
                      className="removeButton"
                    >
                      Remove User
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredUsers.length === 0 && <p>No users found.</p>}
        </>
      )}
    </div>
    );
  };
  
  export default GroupData;