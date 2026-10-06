import { useState, useEffect } from "react";
import axios from "axios";
import { findStorageAllocation } from "../utils/allocation";

export default function Marketplace() {
  const [providers, setProviders] = useState([]);
  const [requiredStorage, setRequiredStorage] = useState(6);
  const [durationMonths, setDurationMonths] = useState(2);
  const [allocationPlan, setAllocationPlan] = useState(null);
  const [message, setMessage] = useState("");
  const [isRenting, setIsRenting] = useState(false);

  const fetchProviders = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/providers");
      setProviders(response.data);
    } catch (error) {
      console.error("Failed to fetch providers:", error);
    }
  };

  useEffect(() => {
    fetchProviders();
  }, []);

  const handleFindStorage = () => {
    setMessage("");
    if (requiredStorage <= 0) {
      setMessage("Required storage must be greater than 0");
      return;
    }
    const plan = findStorageAllocation(requiredStorage, providers);
    setAllocationPlan(plan);
  };

  const handleConfirmRental = async () => {
    if (!allocationPlan || allocationPlan.error) return;

    setIsRenting(true);
    setMessage("");

    const currentUser = JSON.parse(localStorage.getItem("decentraUser") || "{}");

    try {
      const response = await axios.post("http://localhost:5000/api/rentals", {
        renterId: currentUser.username || "USER-001",
        storageGB: requiredStorage,
        durationMonths: durationMonths,
        allocations: allocationPlan.allocations
      });
      setMessage(`Storage rental created successfully! Rental ID: ${response.data.rental.rentalId}`);
      setAllocationPlan(null);
      fetchProviders(); // Refresh capacities
    } catch (error) {
      setMessage(error.response?.data?.message || "Rental failed");
    } finally {
      setIsRenting(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Storage Marketplace</h1>
        <p>Find available storage providers and rent secure decentralized storage.</p>
      </div>

      <div className="grid-2" style={{ marginBottom: "24px" }}>
        <div className="card">
          <h2>Find Storage</h2>
          <div style={{ marginTop: "16px" }}>
            <label style={{ display: "block", marginBottom: "8px" }}>Required Storage (GB):</label>
            <input 
              type="number" 
              className="input-field" 
              value={requiredStorage} 
              onChange={(e) => setRequiredStorage(Number(e.target.value))} 
            />
          </div>
          <div style={{ marginTop: "16px" }}>
            <label style={{ display: "block", marginBottom: "8px" }}>Duration (Months):</label>
            <input 
              type="number" 
              className="input-field" 
              value={durationMonths} 
              onChange={(e) => setDurationMonths(Number(e.target.value))} 
            />
          </div>
          <button 
            className="btn-primary" 
            style={{ marginTop: "24px", width: "100%" }} 
            onClick={handleFindStorage}
          >
            Find Storage
          </button>
        </div>

        <div className="card">
          <h2>Allocation Preview</h2>
          {allocationPlan ? (
            allocationPlan.error ? (
              <div style={{ color: "var(--danger)", marginTop: "16px" }}>
                {allocationPlan.error}
              </div>
            ) : (
              <div style={{ marginTop: "16px" }}>
                <p>Your Request: <strong>{allocationPlan.requestedStorage} GB</strong> for <strong>{durationMonths} Months</strong></p>
                
                <h3 style={{ marginTop: "16px", marginBottom: "8px" }}>Suggested Allocation:</h3>
                <div style={{ backgroundColor: "var(--bg-secondary)", borderRadius: "8px", padding: "16px" }}>
                  {allocationPlan.allocations.map((alloc, idx) => {
                    const provider = providers.find(p => p.providerId === alloc.providerId);
                    const cost = provider ? (provider.pricePerGBMonth * alloc.storageGB * durationMonths) : 0;
                    return (
                      <div key={idx} style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                        <span>{alloc.providerId}</span>
                        <span><strong>{alloc.storageGB} GB</strong> <span style={{color: "var(--text-secondary)", fontSize: "14px"}}>- {cost.toFixed(2)} ?</span></span>
                      </div>
                    );
                  })}
                  <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "8px", marginTop: "8px", display: "flex", justifyContent: "space-between" }}>
                    <span>Total:</span>
                    <div>
                      <strong>{allocationPlan.requestedStorage} GB</strong>
                      <div style={{color: "var(--primary)", fontWeight: "bold", textAlign: "right"}}>
                        {allocationPlan.allocations.reduce((sum, alloc) => {
                          const p = providers.find(p => p.providerId === alloc.providerId);
                          return sum + (p ? (p.pricePerGBMonth * alloc.storageGB * durationMonths) : 0);
                        }, 0).toFixed(2)} ?
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "16px", marginTop: "24px" }}>
                  <button className="btn-primary" onClick={handleConfirmRental} disabled={isRenting}>
                    {isRenting ? "Confirming..." : "Confirm Rental"}
                  </button>
                  <button className="btn-secondary" onClick={() => setAllocationPlan(null)} disabled={isRenting}>
                    Cancel
                  </button>
                </div>
              </div>
            )
          ) : (
            <p style={{ marginTop: "16px" }}>Enter your requirements and click "Find Storage" to preview allocations.</p>
          )}

          {message && (
            <div style={{ marginTop: "16px", padding: "12px", backgroundColor: "rgba(16, 185, 129, 0.1)", color: "var(--success)", borderRadius: "8px" }}>
              {message}
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <h2>Available Providers</h2>
        <div className="grid-3" style={{ marginTop: "16px" }}>
          {providers.map((p) => (
            <div key={p.providerId} className="card" style={{ backgroundColor: "var(--bg-secondary)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
                <h3 style={{ fontSize: "16px" }}>{p.providerName || p.providerId}</h3>
                <span className={`badge ${p.availableStorageGB > 0 ? 'available' : 'expired'}`}>
                  {p.availableStorageGB > 0 ? "Available" : "Full"}
                </span>
              </div>
              <p style={{ marginBottom: "4px" }}>Available: <strong>{p.availableStorageGB} GB</strong></p>
              <p style={{ marginBottom: "4px" }}>Rented: {p.rentedStorageGB} GB</p>
              <p>Total: {p.totalStorageGB} GB</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
