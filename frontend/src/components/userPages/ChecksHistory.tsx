import { useEffect, useState } from "react";
import axios from 'axios';
import './activeRequests.css';
import './checksHistory.css';
import { useToken, useTokenProperty } from "../../utils/decodingUtils";

interface RequestData {
  _id: string;
  username: string;
  isValid: boolean;
  apiCodeId: { description: string };
  createdAt: string; // timestamp from the backend
  adminsNotes: string | null;
  adminsDecision: string | null;
}

const ChecksHistory = () => {
  const [requests, setChecks] = useState<RequestData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const accessToken: string | null = useToken("access");
  const userId: string = useTokenProperty("userId");

  useEffect(() => {
    const fetchChecksHistory = async () => {
      if (!accessToken) {
        setError("Access token is missing.");
        return;
      }
      try{
        const response = await axios.get(`http://localhost:3000/checks-history/${userId}`,
          {
            headers: {Authorization:`Bearer ${accessToken}`,},
          });
          setChecks(response.data);
      } catch (err: any) {
        setError("Failed to fetch checks history.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchChecksHistory();
  },);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

    return (
      <div className="requests-container">
      <h1>Checks History</h1>
      <div className="table-container">
        <table className="requests-table">
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
            {requests.map((request,index) => (
              <tr key={request._id} className={index % 2 === 0 ? "dark-row" : "light-row"}>
                <td className="number-column">{index + 1}</td>
                <td>{new Date(request.createdAt).toLocaleString()}</td>
                <td>{request.apiCodeId.description}</td>
                <td className={request.isValid ? "status-valid" : "status-invalid"}>{request.isValid ? "Valid" : "Invalid"}</td>
                <td>{request.adminsNotes || "No notes provided"}</td>
                <td>{request.adminsDecision || "No decision provided"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
  };
  
  export default ChecksHistory;