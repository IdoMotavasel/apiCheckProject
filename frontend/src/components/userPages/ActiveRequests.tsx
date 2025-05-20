import { useEffect, useState } from "react";
import axios from 'axios';
//import '../../historyPage.css';
import { useToken, useTokenProperty } from "../../utils/decodingUtils";
import {toast} from 'react-toastify';
import './activeRequests.css';

interface RequestData {
  _id: string;
  isValid: boolean;
  apiCodeId: { description: string };
  createdAt: string;
}

const ActiveRequests = () => {
  const [requests, setRequests] = useState<RequestData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");

  const accessToken:string | null = useToken("access");
  const userId: string = useTokenProperty("userId");

  useEffect(() => {
    const handleRemove = (event: Event) => {
      const customEvent = event as CustomEvent<string>;
      const requestIdToRemove = customEvent.detail;
  
      setRequests((prev) => prev.filter(r => r._id !== requestIdToRemove));
    };
  
    window.addEventListener("removeActiveRequest", handleRemove);
  
    return () => {
      window.removeEventListener("removeActiveRequest", handleRemove);
    };
  }, []);

  useEffect(() => {
    const pendingName = localStorage.getItem("pendingRemovedRequestName");
    if (pendingName) {
      toast.info(`The request - ${pendingName}, was reviewed and returned by the admin.`);
      localStorage.removeItem("pendingRemovedRequestName");
    }
  }, []);

  const fetchActiveRequests = async () => {
    if (!accessToken) {
      setError("Access token is missing.");
      return;
    }
    try {
      const response = await axios.get(`http://localhost:3000/user/active-request/${userId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setRequests(response.data);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err: any) {
      setError("Failed to fetch active requests.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveRequests();
  }, [accessToken, userId]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  const filteredRequests = requests.filter((r) =>
    r.apiCodeId.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    new Date(r.createdAt).toLocaleString().toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
      <div className="active-requests-container">
        <h1 className="active-requests-header">Active Requests</h1>
        <p className="active-requests-message">
          The admin is checking your codes. Be patient...
        </p>

        <input
          className="active-requests-search"
          type="text"
          placeholder="Search by description or date..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        {filteredRequests.length === 0 ? (
          <div className="active-requests-empty-card">
          <img
            src="https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExMWZncTV1N3Q4a3o1N2ZydDI0YmZ2c3cxMGJtenR4bGowOHd5NG1ldCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/8yvdQMhayX1zbMou11/giphy.gif"
            alt="No active requests"
            className="active-requests-empty-image"
          />
          <h3>No Active Requests</h3>
          <p>You're all caught up! New activity will show up here automatically.</p>
        </div>
        ) : (
          <div className="active-requests-table-container">
            <table className="active-requests-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Date Sent</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((request, index) => (
                  <tr key={request._id} className={index % 2 === 0 ? "active-requests-dark-row" : "active-requests-light-row"}>
                    <td className="active-requests-number">{index + 1}</td>
                    <td>{new Date(request.createdAt).toLocaleString()}</td>
                    <td>{request.apiCodeId.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
  );
  };
  
  export default ActiveRequests;