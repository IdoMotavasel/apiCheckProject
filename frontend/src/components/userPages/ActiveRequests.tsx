import { useEffect, useState } from "react";
import axios from 'axios';
import './activeRequests.css';
import { useToken, useTokenProperty } from "../../utils/decodingUtils";

interface RequestData {
  _id: string;
  username: string;
  isValid: boolean;
  apiCodeId: { description: string };
  createdAt: string;
}

const ActiveRequests = () => {
  const [requests, setRequests] = useState<RequestData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const accessToken:string | null = useToken("access");
  const userId: string = useTokenProperty("userId");

  useEffect(() => {
    const fetchActiveRequests = async () => {
      if (!accessToken) {
        setError("Access token is missing.");
        return;
      }
      try{
        const response = await axios.get(`http://localhost:3000/active-request/${userId}`,
          {
            headers: {Authorization:`Bearer ${accessToken}`,},
          });
        setRequests(response.data);
      } catch (err: any) {
        setError("Failed to fetch active requests.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchActiveRequests();
  },);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

    return (
      <div className="requests-container">
      <h1>Active Requests</h1>
      <div className="table-container">
        <table className="requests-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Date Sent</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((request,index) => (
              <tr key={request._id} className={index % 2 === 0 ? "dark-row" : "light-row"}>
                <td className="number-column">{index + 1}</td>
                <td>{new Date(request.createdAt).toLocaleString()}</td>
                <td>{request.apiCodeId.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
  };
  
  export default ActiveRequests;