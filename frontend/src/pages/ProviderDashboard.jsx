import { useState, useEffect } from "react";
import axios from "axios";

function formatStorage(gbVal) {
  if (gbVal === 0) return "0 GB";
  if (gbVal >= 1024) return (gbVal / 1024).toFixed(2).replace(/\.00$/, '') + " TB";
  if (gbVal < 1) return (gbVal * 1024).toFixed(2).replace(/\.00$/, '') + " MB";
  return gbVal.toFixed(2).replace(/\.00$/, '') + " GB";
}

export default function ProviderDashboard({ user }) {
  const [providerData, setProviderData] = useState(null);
  const [activeRentals, setActiveRentals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const providersRes = await axios.get("http://localhost:5000/api/providers");
        const rentalsRes = await axios.get("http://localhost:5000/api/rentals");
        
        const me = providersRes.data.find(p => p.providerId === user.name || p.providerId === user.id);
        if (me) {
          setProviderData(me);
          
          const myRentals = rentalsRes.data.filter(r => 
            r.status === 'ACTIVE' && r.allocations.some(a => a.providerId === me.providerId)
          ).map(r => {
            const alloc = r.allocations.find(a => a.providerId === me.providerId);
            return {
              ...r,
              allocatedToMe: alloc.storageGB,
              myEarnings: alloc.storageGB * me.pricePerGBMonth * r.durationMonths
            };
          });
          
          setActiveRentals(myRentals);
        } else {
          // Server restarted and lost in-memory state
          localStorage.removeItem("decentraUser");
          window.location.reload();
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (user?.name || user?.id) {
      fetchDashboardData();
    }
  }, [user]);

  if (loading) return <div>Loading dashboard...</div>;
  if (!providerData) return <div>Provider data not found. Please contact admin.</div>;

  const utilization = providerData.totalStorageGB > 0 
    ? ((providerData.rentedStorageGB / providerData.totalStorageGB) * 100).toFixed(1) 
    : 0;

  const totalEarnings = activeRentals.reduce((sum, r) => sum + r.myEarnings, 0);
  const currencySymbol = providerData.currency === "USD" ? "$" : "\u20B9";

  return (
    <div>
      <div className="page-header">
        <h1>Provider Dashboard</h1>
        <p>Manage your storage node and monitor earnings.</p>
      </div>

      <div className="grid-3" style={{ marginBottom: "24px" }}>
        <div className="card">
          <div style={{ color: "var(--text-secondary)", marginBottom: "8px" }}>Allocated Storage</div>
          <div style={{ fontSize: "28px", fontWeight: "bold" }}>{formatStorage(providerData.totalStorageGB)}</div>
        </div>
        
        <div className="card">
          <div style={{ color: "var(--text-secondary)", marginBottom: "8px" }}>Rented / Utilization</div>
          <div style={{ fontSize: "28px", fontWeight: "bold" }}>
            {formatStorage(providerData.rentedStorageGB)} <span style={{ fontSize: "14px", color: "var(--text-secondary)" }}>({utilization}%)</span>
          </div>
        </div>

        <div className="card">
          <div style={{ color: "var(--text-secondary)", marginBottom: "8px" }}>Available to Rent</div>
          <div style={{ fontSize: "28px", fontWeight: "bold", color: "var(--success)" }}>
            {formatStorage(providerData.availableStorageGB)}
          </div>
        </div>
      </div>

      <div className="grid-3" style={{ marginBottom: "32px" }}>
        <div className="card">
          <div style={{ color: "var(--text-secondary)", marginBottom: "8px" }}>Active Rentals</div>
          <div style={{ fontSize: "24px", fontWeight: "bold" }}>{activeRentals.length}</div>
        </div>
        <div className="card">
          <div style={{ color: "var(--text-secondary)", marginBottom: "8px" }}>Total Earnings</div>
          <div style={{ fontSize: "24px", fontWeight: "bold" }}>{currencySymbol} {totalEarnings.toFixed(2)}</div>
        </div>
        <div className="card">
          <div style={{ color: "var(--text-secondary)", marginBottom: "8px" }}>Price Per GB/Month</div>
          <div style={{ fontSize: "24px", fontWeight: "bold" }}>{currencySymbol} {providerData.pricePerGBMonth}</div>
        </div>
      </div>

      <div className="card">
        <h2>Active Rentals</h2>
        {activeRentals.length === 0 ? (
          <p style={{ color: "var(--text-secondary)", textAlign: "center", padding: "20px" }}>No active rentals</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "16px", fontSize: "14px" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)", color: "var(--text-secondary)", textAlign: "left" }}>
                <th style={{ padding: "12px 8px" }}>Renter ID</th>
                <th style={{ padding: "12px 8px" }}>Allocated Storage</th>
                <th style={{ padding: "12px 8px" }}>Duration</th>
                <th style={{ padding: "12px 8px" }}>Expiry Date</th>
                <th style={{ padding: "12px 8px" }}>Earnings</th>
                <th style={{ padding: "12px 8px" }}>Blockchain TX</th>
              </tr>
            </thead>
            <tbody>
              {activeRentals.map(rental => (
                <tr key={rental.id} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "12px 8px" }}>{rental.renterId}</td>
                  <td style={{ padding: "12px 8px" }}>{formatStorage(rental.allocatedToMe)}</td>
                  <td style={{ padding: "12px 8px" }}>{rental.durationMonths} Months</td>
                  <td style={{ padding: "12px 8px" }}>{new Date(rental.expiryDate).toLocaleDateString()}</td>
                  <td style={{ padding: "12px 8px", color: "var(--success)" }}>{currencySymbol} {rental.myEarnings.toFixed(2)}</td>
                  <td style={{ padding: "12px 8px" }}>
                    {rental.blockchainTx ? (
                      <a href={`/provider/tx/${rental.blockchainTx}`} style={{ color: "var(--primary)", textDecoration: "none", fontWeight: "bold" }} title={rental.blockchainTx}>
                        {rental.blockchainTx.substring(0, 10)}...
                      </a>
                    ) : (
                      <span style={{ color: "var(--text-secondary)" }}>Pending</span>
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
