import { useEffect, useState } from "react";
import axios from 'axios';
import './requestHistory.css';
import { useToken, useTokenProperty } from "../../utils/decodingUtils";
import TokenWrapper from "../routeHelpers/TokenWrapper";

interface RequestData {
  _id: string;
  username: string;
  isValid: boolean;
  apiCodeId: { description: string };
  createdAt: string;
  adminsNotes: string | null;
  adminsDecision: string | null;
}

const RequestHistory = () => {
  const [requests, setRequests] = useState<RequestData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const accessToken: string | null = useToken("access");
  const adminId: string = useTokenProperty("userId");

  useEffect(() => {
    const fetchRequestsHistory = async () => {
      if (!accessToken) {
        setError("Access token is missing.");
        return;
      }

      try {
        const response = await axios.get(`http://localhost:3000/requests-history/${adminId}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        setRequests(response.data);
      } catch (err: any) {
        setError("Failed to fetch requests history.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchRequestsHistory();
  }, [accessToken, adminId]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <TokenWrapper>
      <div className="main-container">
        <h1 className="request-history-header">Requests History</h1>
        <div className="request-history-table-container">
          <table className="request-history-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Date Sent</th>
                <th>Description</th>
                <th>Status</th>
                <th>Admin's Notes</th>
                <th>Admin's Decision</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((request, index) => (
                <tr key={request._id} className={index % 2 === 0 ? "request-history-dark-row" : "request-history-light-row"}>
                  <td className="request-history-number-column">{index + 1}</td>
                  <td>{new Date(request.createdAt).toLocaleString()}</td>
                  <td>{request.apiCodeId.description}</td>
                  <td className={request.isValid ? "request-history-status-valid" : "request-history-status-invalid"}>
                    {request.isValid ? "Valid" : "Invalid"}
                  </td>
                  <td className="request-history-admin-notes">{request.adminsNotes || "No notes provided"}</td>
                  <td className="request-history-admin-decision">{request.adminsDecision || "No decision provided"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </TokenWrapper>
  );
};

export default RequestHistory;