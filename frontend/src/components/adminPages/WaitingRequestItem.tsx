import React, { useState } from "react";
import axios from "axios";
import { useToken } from "../../utils/decodingUtils";
import TokenWrapper from "../routeHelpers/TokenWrapper";

interface WaitingRequestItemProps {
  username: string;
  dateOfSubmission: string;
  description: string;
  requestId: string;
  onUpdate: () => void;
}

const WaitingRequestItem: React.FC<WaitingRequestItemProps> = ({
  username,
  dateOfSubmission,
  description,
  requestId,
  onUpdate
}) => {
  const [notes, setNotes] = useState<string>("");
  const accessToken = useToken("access");

  const handleDownload = () => {
    // Implement download logic here
    console.log(`Downloading API code for ${username}`);
  };

  const handleDecision = async (decision: "approved" | "disapproved") => {
    try{
      await axios.patch(`http://localhost:3000/admin/update-user-request/${requestId}`,
        {
          adminsNotes:notes,
          adminsDecision: decision
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        }
      );
      console.log(`${decision} request for ${username}`);
      onUpdate();
    }catch(error:any){
      console.error(`Error processing request ${decision} for ${username}:`, error);
    }
  }

  const handleNotesChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNotes(event.target.value);
  };

  return (
    <TokenWrapper>
      <li className="request-item">
        <div>
          <strong>{username}</strong>
        </div>
        <div>{new Date(dateOfSubmission).toLocaleString()}</div>
        <div>{description}</div>

        {/* Text area for notes */}
        <div>
          <textarea
            value={notes}
            onChange={handleNotesChange}
            placeholder="Enter your notes here"
            rows={4}
            style={{ width: "100%", borderRadius: "8px", padding: "0.5rem", marginTop: "1rem" }}
          />
        </div>

        <div className="button-container">
          <button onClick={handleDownload}>Download</button>
          <button onClick={() => handleDecision("approved")}>Approve</button>
          <button onClick={() => handleDecision("disapproved")}>Disapprove</button>
        </div>
      </li>
    </TokenWrapper>
  );
};

export default WaitingRequestItem;

