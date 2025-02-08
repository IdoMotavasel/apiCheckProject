import { useEffect, useState } from "react";
import WaitingRequestItem from './WaitingRequestItem';
import { useTokenProperty, useToken } from '../../utils/decodingUtils'; 
import axios from "axios";
import './waitingRequests.css';
import TokenWrapper from "../routeHelpers/TokenWrapper";

interface RequestData {
  _id:string;
  username: string;
  createdAt: string; // timestamp from the backend
  apiCodeId: { description: string };
}

const WaitingRequests = (): JSX.Element => {
  const userId = useTokenProperty("userId");
  const accessToken = useToken("access");
  const [requests, setRequests] = useState<RequestData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const fetchRequests = async () => {
    if (!accessToken) {
      setError("Access token is missing.");
      setLoading(false);
      return;
    }
    try {
      const response = await axios.get(
        `http://localhost:3000/admin/${userId}/waiting-requests`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      console.log("response data: ",response.data );

      if (response.status === 200) {
        console.log("status 200");
        if (response.data && Array.isArray(response.data)) {
          if (response.data.length === 0) {
            setMessage("No active requests.");
          }else {
            setRequests(response.data);
          }
        } else if(response.data.message) {
          setMessage(response.data.message);
        }
      } else {
        setError("Error fetching waiting requests.");
        console.error("Error fetching waiting requests.");
      }
    } catch (error) {
      setError("Error fetching waiting requests.");
      console.error("Error fetching waiting requests:", error);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchRequests();
  }, [userId, accessToken]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <TokenWrapper>
      <div className="main-container">
        <h1 className= "waiting-requests-headline">Waiting Requests</h1>
        <p>This is the Waiting Requests page.</p>
        {message ? (
          <div className="no-users-message">{message}</div> // Display the message
        ) : (
          <ul className="scrollable-list">
            {requests.length === 0 ? (
              <li>No active requests</li> // Display message when no requests are available
            ) : (
              requests.map((request) => (
                <WaitingRequestItem
                  key={request._id}
                  requestId={request._id}
                  username={request.username}
                  dateOfSubmission={request.createdAt}
                  description={request.apiCodeId.description}
                  onUpdate={fetchRequests}
                />
              ))
            )}
          </ul>
        )}
      </div>
    </TokenWrapper>
  );
};

export default WaitingRequests;
