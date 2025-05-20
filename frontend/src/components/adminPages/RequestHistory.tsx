import { useEffect, useState } from "react";
import axios from 'axios';
import { useToken, useTokenProperty } from "../../utils/decodingUtils";
import ControlBar from "../controlBar/ControlBar";
import '../history.css';

interface RequestData {
  _id: string;
  apiCodeId: { description: string };
  userId: { username: string};
  createdAt: string;
  adminsNotes: string | null;
  adminsDecision: string;
}

const RequestHistory = () => {
  const [requests, setRequests] = useState<RequestData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");

  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name'>('newest');
  const [filterBy, setFilterBy] = useState<'all' | 'approved' | 'disapproved'>('all');
  const [showRecentOnly, setShowRecentOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const accessToken: string | null = useToken("access");
  const adminId: string = useTokenProperty("userId");

  const fetchRequestsHistory = async () => {
    if (!accessToken) return setError("Access token is missing.");
    try {
      const response = await axios.get(`http://localhost:3000/admin/requests-history/${adminId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (Array.isArray(response.data)) {
        setRequests(response.data);
        setMessage(response.data.length === 0 ? "No request history found." : null);
      } else {
        setMessage("Unexpected response from server.");
      }
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      setError("Failed to fetch requests history.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequestsHistory();
  }, [accessToken, adminId]);

  const filtered = requests
    .filter(r =>
      r.userId.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      new Date(r.createdAt).toLocaleString().toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter(r => {
      if (filterBy === 'approved') return r.adminsDecision === 'approved';
      if (filterBy === 'disapproved') return r.adminsDecision === 'disapproved';
      return true;
    });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (sortBy === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    return a.userId.username.localeCompare(b.userId.username);
  });

  const recentLimited = showRecentOnly ? sorted.slice(0, 5) : sorted;
  const pageCount = Math.ceil(recentLimited.length / itemsPerPage);
  const paginated = recentLimited.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
      <div className="history-container">
        <h1 className="history-header">Requests History</h1>

        <ControlBar
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          sortOption={sortBy}
          setSortOption={setSortBy}
          sortOptions={[
            { label: "Newest First", value: "newest" },
            { label: "Oldest First", value: "oldest" },
            { label: "Username A-Z", value: "name" },
          ]}
          filterValue={filterBy}
          setFilterValue={setFilterBy}
          filterOptions={[
            { label: "All", value: "all" },
            { label: "Approved", value: "approved" },
            { label: "Disapproved", value: "disapproved" },
          ]}
          toggleLabel={showRecentOnly ? "Show All" : "Show Last 5"}
          onToggle={() => setShowRecentOnly(!showRecentOnly)}
          currentPage={currentPage}
          totalPages={pageCount}
          onPageChange={setCurrentPage}
        />

        {paginated.length === 0 ? (
          <div className="history-empty-card">
            <img
              src="https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExem53a3ZhbmdoMGpkNXd0ano5dTA1OWVjdXhhZWIxdWh0dndtemQxeCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/uDj0Fa3q8ipBS/giphy.gif"
              alt="No request history"
              className="history-empty-image"
            />
            <h3>No Requests History</h3>
            <p>Once user submissions are reviewed, they will appear here.</p>
          </div>
        ) : (
          <div className="history-table-container">
            <table className="history-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Username</th>
                  <th>Date Sent</th>
                  <th>Description</th>
                  <th>Admin's Notes</th>
                  <th>Admin's Decision</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((request, index) => (
                  <tr
                    key={request._id}
                    className={index % 2 === 0 ? "history-dark-row" : "history-light-row"}
                  >
                    <td className="history-number-column">
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </td>
                    <td>{request.userId.username}</td>
                    <td>{new Date(request.createdAt).toLocaleString()}</td>
                    <td>{request.apiCodeId.description}</td>
                    <td className="history-admin-notes">
                      {request.adminsNotes || <span>No notes provided</span>}
                    </td>
                    <td className="history-admin-decision">
                      {request.adminsDecision || <span>No decision provided</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )}
      </div>
  );
};

export default RequestHistory;