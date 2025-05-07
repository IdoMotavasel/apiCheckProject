import { useEffect, useState } from "react";
import axios from 'axios';
import '../../historyPage.css';
import { useToken, useTokenProperty } from "../../utils/decodingUtils";
import {toast} from 'react-toastify';

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
      <div className="main-container">
        <h1 className="history-header">Active Requests</h1>
        <p className="ar-message">
          The admin is checking your codes. Be patient...
        </p>

        <div className="search-refresh-bar">
          <input
            className="ch-search-bar"
            type="text"
            placeholder="Search by description or date..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <div className="refresh-block">
            <button className="rh-refresh-button" onClick={fetchActiveRequests}>🔄 Refresh</button>
            <span className="rh-updated-time"> Last updated at: {lastUpdated}</span>
          </div>
        </div>

        {filteredRequests.length === 0 ? (
          <p className="history-empty-message">📭 No active requests. Stop Joking and Start Coding!</p>
        ) : (
          <div className="history-table-container">
            <table className="history-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Date Sent</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((request, index) => (
                  <tr key={request._id} className={index % 2 === 0 ? "history-dark-row" : "history-light-row"}>
                    <td className="history-number-column">{index + 1}</td>
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