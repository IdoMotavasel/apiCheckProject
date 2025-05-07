import { useEffect, useState } from "react";
import axios from 'axios';
import './checksHistory.css';
import { useToken, useTokenProperty } from "../../utils/decodingUtils";
import { toast } from "react-toastify";
import ControlBar from "../controlBar/ControlBar";

interface RequestData {
  _id: string;
  apiCodeId: { description: string , name:string };
  createdAt: string; // timestamp from the backend
  adminsNotes: string | null;
  adminsDecision: string | null;
}

const ChecksHistory = () => {
  const [requests, setChecks] = useState<RequestData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMounted, setHasMounted] = useState(false); // to avoid double toasts

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name'>('newest');
  const [filterBy, setFilterBy] = useState<'all' | 'approved' | 'disapproved'>('all');
  const [showRecentOnly, setShowRecentOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const accessToken: string | null = useToken("access");
  const userId: string = useTokenProperty("userId");

  const fetchChecksHistory = async () => {
    if (!accessToken) {
      setError("Access token is missing.");
      return;
    }
    try {
      const response = await axios.get(`http://localhost:3000/user/checks-history/${userId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setChecks(response.data);
    } catch (err: any) {
      setError("Failed to fetch checks history.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChecksHistory();
    setHasMounted(true);
  }, []);

  useEffect(() => {
    const handleRefresh = () => {
      fetchChecksHistory();
    };

    window.addEventListener("refreshHistory", handleRefresh);
    return () => {
      window.removeEventListener("refreshHistory", handleRefresh);
    };
  }, []);

  useEffect(() => {
    if (!hasMounted) return;

    const pending = parseInt(localStorage.getItem("pendingHistoryCount") || "0", 10);
    if (pending > 0) {
      toast.info(`You have ${pending} check${pending > 1 ? "s" : ""} added to history.`);
      localStorage.removeItem("pendingHistoryCount");
    }
  }, [hasMounted]);

  const filtered = requests
    .filter((r) =>
      r.apiCodeId.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      new Date(r.createdAt).toLocaleString().toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter((r) => {
      if (filterBy === 'approved') return r.adminsDecision === 'approved';
      if (filterBy === 'disapproved') return r.adminsDecision === 'disapproved';
      return true;
    });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (sortBy === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    return a.apiCodeId.name.localeCompare(b.apiCodeId.name);
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
      <div className="main-container">
        <h1 className="ch-header">Checks History</h1>

        <ControlBar
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          sortOption={sortBy}
          setSortOption={setSortBy}
          sortOptions={[
            { label: "Newest First", value: "newest" },
            { label: "Oldest First", value: "oldest" },
            { label: "Name A-Z", value: "name" },
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

        <div className="history-table-container">
          {paginated.length === 0 ? (
            <p className="rh-no-checks-message">🦗 No checks match your filters...</p>
          ) : (
            <table className="history-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Date Sent</th>
                  <th>Api Name</th>
                  <th>Description</th>
                  <th>Admin's Notes</th>
                  <th>Admin's Decision</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((request, index) => (
                  <tr key={request._id} className={index % 2 === 0 ? "history-dark-row" : "history-light-row"}>
                    <td className="history-number-column">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                    <td>{new Date(request.createdAt).toLocaleString()}</td>
                    <td>{request.apiCodeId.name}</td>
                    <td>{request.apiCodeId.description}</td>
                    <td className="history-admin-notes">{request.adminsNotes || "No notes provided"}</td>
                    <td className="history-admin-decision">{request.adminsDecision || "No decision provided"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
  );
};
  
  export default ChecksHistory;