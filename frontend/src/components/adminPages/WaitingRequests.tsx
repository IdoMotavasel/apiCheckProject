import { useEffect, useState } from "react";
import { useTokenProperty, useToken } from '../../utils/decodingUtils'; 
import axios from "axios";
import './waitingRequests.css';
import { UnControlled as CodeMirror } from 'react-codemirror2';
import 'codemirror/lib/codemirror.css';
import 'codemirror/mode/javascript/javascript';
import 'codemirror/theme/yonce.css';
import {toast} from 'react-toastify';

interface RequestData {
  _id: string;
  userId: { username:string};
  createdAt: string;
  apiCodeId: { description: string; apiCode: string };
}

const WaitingRequests = (): JSX.Element => {
  const userId = useTokenProperty("userId");
  const accessToken = useToken("access");
  const [requests, setRequests] = useState<RequestData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [notesMap, setNotesMap] = useState<Record<string, string>>({});
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [removingRequestId, setRemovingRequestId] = useState<string | null>(null);

  const fetchWaitingRequests = async () => {
    setLoading(true);
    if (!accessToken) {
      setError("Access token is missing.");
      return;
    }
    try {
      const response = await axios.get(
        `http://localhost:3000/admin/${userId}/waiting-requests`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      if (response.status === 200) {
        if (response.data && Array.isArray(response.data)) {
          if (response.data.length === 0) {
            setMessage("No active requests. 💼🔴");
          } else {
            setRequests(response.data);
            setMessage(null);
          }
        } else if (response.data.message) {
          setMessage(response.data.message);
        }
      } else {
        setError("Error fetching waiting requests.");
      }
      setLastUpdated(new Date().toLocaleTimeString());
    } catch {
      setError("Error fetching waiting requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const refreshHandler = () => {
      fetchWaitingRequests();
    };
  
    window.addEventListener("refreshWaitingRequests", refreshHandler);
  
    return () => {
      window.removeEventListener("refreshWaitingRequests", refreshHandler);
    };
  }, []);

  useEffect(() => {
    const newUsername = localStorage.getItem("pendingNewRequestToast");
    if (newUsername) {
      toast.info(`New request from: ${newUsername}`);
      localStorage.removeItem("pendingNewRequestToast");
    }
  }, []);

  const handleDecision = async (requestId: string, decision: 'approved' | 'disapproved') => {
    try {
      const adminsNotes = notesMap[requestId] || "";
      const response = await axios.patch(
        `http://localhost:3000/admin/update-user-request/${requestId}`,
        { adminsDecision: decision, adminsNotes },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.status === 200) {
        toast.success(`Request ${decision} successfully! 🎉`);
        setRemovingRequestId(requestId);
        setTimeout(() => {
          setRequests(prev => {
            const updated = prev.filter(r => r._id !== requestId);
            if (updated.length === 0) {
              setMessage("No active requests. 💼🔴"); // ✨ set message if none left
            }
            return updated;
          });
          setNotesMap(prev => {
            const updated = { ...prev };
            delete updated[requestId];
            return updated;
          });
          setRemovingRequestId(null);
        }, 400);
      }
    } catch (err) {
      console.error("Error updating request:", err);
      toast.error(`Failed to ${decision} the request. ❌`);
    }
  };

  useEffect(() => {
    fetchWaitingRequests();
  }, [userId, accessToken]);

  const filteredRequests = requests.filter(r =>
    r.userId.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    new Date(r.createdAt).toLocaleString().toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
      <div className="wr-container">
        <h1 className="wr-headline">Waiting Requests</h1>
        <p className="wr-subtitle">Users are waiting... But don't rush greatness!</p>

        <input
          className="wr-search-bar"
          type="text"
          placeholder="Search by user or date..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <div className="wr-chart-header">
          <button className="wr-refresh-button" onClick={fetchWaitingRequests}>🔄 Refresh</button>
          <span className="wr-updated-time">Last updated at: {lastUpdated}</span>
        </div>

        {message ? (
          <div className="wr-message">{message}</div>
        ) : (
          <table className="wr-table">
            <thead>
              <tr>
                <th className="wr-th wr-small">Username</th>
                <th className="wr-th wr-small">Time</th>
                <th className="wr-th wr-medium">Description</th>
                <th className="wr-th wr-large">Code</th>
                <th className="wr-th wr-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.map((request) => (
                <tr key={request._id} className={`wr-row ${removingRequestId === request._id ? 'fade-out' : ''}`}>
                  <td className="wr-td wr-small">{request.userId.username}</td>
                  <td className="wr-td wr-small">{new Date(request.createdAt).toLocaleString()}</td>
                  <td className="wr-td wr-medium">{request.apiCodeId.description}</td>
                  <td className="wr-td wr-large">
                    <CodeMirror
                      value={request.apiCodeId.apiCode}
                      options={{
                        mode: 'javascript',
                        theme: 'yonce',
                        lineNumbers: true,
                        readOnly: 'nocursor',
                      }}
                    />
                  </td>
                  <td className="wr-td wr-medium">
                    <textarea 
                    className="wr-notes" 
                    placeholder="Add notes..." 
                    value={notesMap[request._id] || ''}
                    onChange={(e) => setNotesMap({ ...notesMap, [request._id]: e.target.value })}
                    />
                    <button 
                    className="wr-button wr-approve"
                    onClick={() => handleDecision(request._id, 'approved')}
                    >Approve</button>
                    <button 
                    className="wr-button wr-disapprove"
                    onClick={() => handleDecision(request._id, 'disapproved')}
                      >Disapprove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
  );
};

export default WaitingRequests;