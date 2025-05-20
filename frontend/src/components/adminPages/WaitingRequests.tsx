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
  mlConfidence?: number;
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
      <div className="waiting-requests-container">
        <h1 className="waiting-requests-headline">Waiting Requests</h1>
        <p className="waiting-requests-subtitle">Users are waiting... But don't rush greatness!</p>

        <input
          className="waiting-requests-search-bar"
          type="text"
          placeholder="Search by user or date..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        {message ? (
          <div className="waiting-requests-empty-card">
          <img
            src="https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExeHlxYzVsZnA5dHNhMWU4bjdyZGlnaWV2ZnkyZDdjc2kyd3ZkZjBkbiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/h8lqnqav0SM4RzGVp1/giphy.gif"
            alt="No requests"
            className="waiting-requests-empty-image"
          />
          <h3>No Pending Requests</h3>
          <p>You're all caught up. New requests will appear here automatically!</p>
        </div>
        ) : (
          <table className="waiting-requests-table">
            <thead>
              <tr>
                <th className="waiting-requests-th waiting-requests-small">Username</th>
                <th className="waiting-requests-th waiting-requests-small">Time</th>
                <th className="waiting-requests-th waiting-requests-medium">Description</th>
                <th className="waiting-requests-th waiting-requests-small">Confidence</th>
                <th className="waiting-requests-th waiting-requests-large">Code</th>
                <th className="waiting-requests-th waiting-requests-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.map((request) => (
                <tr key={request._id} className={`waiting-requests-row ${removingRequestId === request._id ? 'fade-out' : ''}`}>
                  <td className="waiting-requests-td waiting-requests-small">{request.userId.username}</td>
                  <td className="waiting-requests-td waiting-requests-small">{new Date(request.createdAt).toLocaleString()}</td>
                  <td className="waiting-requests-td waiting-requests-medium">{request.apiCodeId.description}</td>
                  <td className="waiting-requests-td waiting-requests-small">
                    {request.mlConfidence !== undefined ? `${(request.mlConfidence * 100).toFixed(1)}%` : '—'}
                  </td>
                  <td className="waiting-requests-td waiting-requests-large">
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
                  <td className="waiting-requests-td waiting-requests-medium">
                    <textarea 
                    className="waiting-requests-notes" 
                    placeholder="Add notes..." 
                    value={notesMap[request._id] || ''}
                    onChange={(e) => setNotesMap({ ...notesMap, [request._id]: e.target.value })}
                    />
                    <button 
                    className="waiting-requests-button waiting-requests-approve"
                    onClick={() => handleDecision(request._id, 'approved')}
                    >Approve</button>
                    <button 
                    className="waiting-requests-button waiting-requests-disapprove"
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