import { useState, useEffect } from "react";
import axios from "axios";

export default function Rentals() {
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const fetchRentals = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/rentals");
      const currentUser = JSON.parse(localStorage.getItem("decentraUser") || "{}");
      const userRentals = response.data.filter(r => r.renterId === currentUser.username);
      // Sort to show newest first
      setRentals(userRentals.reverse());
    } catch (error) {
      console.error("Failed to fetch rentals:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRentals();
  }, []);

  const handleExpire = async (rentalId) => {
    try {
      await axios.post(`http://localhost:5000/api/rentals/${rentalId}/expire`);
      setMessage(`Rental ${rentalId} expired successfully and storage released.`);
      fetchRentals();
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to expire rental");
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>My Rentals</h1>
        <p>Manage your active storage rentals.</p>
      </div>

      {message && (
        <div style={{ marginBottom: "24px", padding: "12px", backgroundColor: "rgba(16, 185, 129, 0.1)", color: "var(--success)", borderRadius: "8px" }}>
          {message}
        </div>
      )}

      <div className="card">
        {loading ? (
          <p>Loading rentals...</p>
        ) : rentals.length === 0 ? (
          <p>You have no active rentals.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Rental ID</th>
                <th>Storage</th>
                <th>Duration</th>
                <th>Providers</th>
                <th>Start Date</th>
                <th>Expiry Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rentals.map((r) => (
                <tr key={r.rentalId}>
                  <td>{r.rentalId}</td>
                  <td>{r.requestedStorageGB || r.storageGB} GB</td>
                  <td>{r.durationMonths || 1} Months</td>
                  <td>
                    {r.allocations ? (
                      r.allocations.map(a => a.providerId).join(" + ")
                    ) : (
                      r.providerId
                    )}
                  </td>
                  <td>{r.startDate ? new Date(r.startDate).toLocaleDateString() : 'N/A'}</td>
                  <td>{r.expiryDate ? new Date(r.expiryDate).toLocaleDateString() : 'N/A'}</td>
                  <td>
                    <span className={`badge ${r.status === 'ACTIVE' ? 'active' : 'expired'}`}>
                      {r.status}
                    </span>
                  </td>
                  <td>
                    {r.status === "ACTIVE" && (
                      <button className="btn-secondary" onClick={() => handleExpire(r.rentalId)}>
                        Simulate Expiry
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
