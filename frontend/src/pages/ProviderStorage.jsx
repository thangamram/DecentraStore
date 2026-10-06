import { useState, useEffect } from "react";
import axios from "axios";

function formatStorage(gbVal) {
  if (gbVal === 0) return "0 GB";
  if (gbVal >= 1024) return (gbVal / 1024).toFixed(2).replace(/\.00$/, '') + " TB";
  if (gbVal < 1) return (gbVal * 1024).toFixed(2).replace(/\.00$/, '') + " MB";
  return gbVal.toFixed(2).replace(/\.00$/, '') + " GB";
}

export default function ProviderStorage({ user }) {
  const [providerData, setProviderData] = useState(null);
  
  const [allocatedStorage, setAllocatedStorage] = useState("");
  const [storageUnit, setStorageUnit] = useState("GB");
  
  const [newPrice, setNewPrice] = useState("");
  const [currency, setCurrency] = useState("INR");
  
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProvider = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/providers");
        const me = res.data.find(p => p.providerId === user.name || p.providerId === user.id);
        if (me) {
          setProviderData(me);
          
          setAllocatedStorage(me.totalStorageGB);
          setStorageUnit("GB");
          
          setNewPrice(me.pricePerGBMonth || 100);
          setCurrency(me.currency || "INR");
        } else {
          localStorage.removeItem("decentraUser");
          window.location.reload();
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (user?.name || user?.id) fetchProvider();
  }, [user]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      let gbEquivalent = Number(allocatedStorage);
      if (storageUnit === "TB") gbEquivalent = gbEquivalent * 1024;
      if (storageUnit === "MB") gbEquivalent = gbEquivalent / 1024;
      
      const res = await axios.put(`http://localhost:5000/api/providers/${providerData.providerId}/storage`, {
        totalStorageGB: gbEquivalent,
        pricePerGBMonth: Number(newPrice),
        currency: currency
      });
      setProviderData(res.data.provider);
      setMessage("Storage profile updated successfully!");
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to update storage");
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!providerData) return <div>Provider data not found.</div>;

  return (
    <div>
      <div className="page-header">
        <h1>My Storage</h1>
        <p>Manage your storage node allocation and pricing for the marketplace.</p>
      </div>

      <div className="grid-3" style={{ marginBottom: "24px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
        <div className="card">
          <div style={{ color: "var(--text-secondary)", marginBottom: "8px" }}>Allocated to Network</div>
          <div style={{ fontSize: "24px", fontWeight: "bold" }}>{formatStorage(providerData.totalStorageGB)}</div>
        </div>
        <div className="card">
          <div style={{ color: "var(--text-secondary)", marginBottom: "8px" }}>Currently Rented Out</div>
          <div style={{ fontSize: "24px", fontWeight: "bold", color: "var(--primary)" }}>{formatStorage(providerData.rentedStorageGB)}</div>
        </div>
        <div className="card">
          <div style={{ color: "var(--text-secondary)", marginBottom: "8px" }}>Available to Rent</div>
          <div style={{ fontSize: "24px", fontWeight: "bold", color: "var(--success)" }}>{formatStorage(providerData.availableStorageGB)}</div>
        </div>
      </div>

      <div className="card" style={{ maxWidth: "550px" }}>
        <h2>Update Marketplace Offer</h2>
        <p style={{ marginBottom: "16px", color: "var(--text-secondary)" }}>
          Set how much storage you want to offer to renters and your pricing strategy.
        </p>
        
        <form onSubmit={handleUpdate}>
          <div style={{ display: "flex", gap: "12px", marginBottom: "16px" }}>
            <div style={{ flex: 2 }}>
              <label style={{ display: "block", marginBottom: "8px" }}>Storage Allocated for Rent</label>
              <input
                type="number"
                className="input-field"
                value={allocatedStorage}
                onChange={(e) => setAllocatedStorage(e.target.value)}
                step="any"
                required
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", marginBottom: "8px" }}>Unit</label>
              <select className="input-field" value={storageUnit} onChange={e => setStorageUnit(e.target.value)}>
                <option value="MB">MB</option>
                <option value="GB">GB</option>
                <option value="TB">TB</option>
              </select>
            </div>
          </div>
          
          <small style={{ color: "var(--text-secondary)", display: "block", marginTop: "-12px", marginBottom: "16px" }}>
            Cannot be less than your currently rented storage ({formatStorage(providerData.rentedStorageGB)}).
          </small>

          <div style={{ display: "flex", gap: "12px", marginBottom: "24px" }}>
            <div style={{ flex: 2 }}>
              <label style={{ display: "block", marginBottom: "8px" }}>Price Per GB/Month</label>
              <input
                type="number"
                className="input-field"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                min="1"
                required
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", marginBottom: "8px" }}>Currency</label>
              <select className="input-field" value={currency} onChange={e => setCurrency(e.target.value)}>
                <option value="INR">INR (₹)</option>
                <option value="USD">USD ($)</option>
              </select>
            </div>
          </div>
          
          <button type="submit" className="btn-primary">Update Profile</button>
          
          {message && (
            <div style={{ marginTop: "16px", padding: "12px", backgroundColor: "var(--bg-secondary)", borderRadius: "8px", color: message.includes("success") ? "var(--success)" : "var(--danger)" }}>
              {message}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
