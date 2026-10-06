import { useState, useEffect } from "react";
import axios from "axios";

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalStorage: 0,
    usedStorage: 0,
    availableStorage: 0,
    activeRentals: 0,
    providerCount: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [providersRes, rentalsRes] = await Promise.all([
          axios.get("http://localhost:5000/api/providers"),
          axios.get("http://localhost:5000/api/rentals")
        ]);
        
        const providers = providersRes.data;
        const rentals = rentalsRes.data;

        const totalStorage = providers.reduce((sum, p) => sum + p.totalStorageGB, 0);
        const availableStorage = providers.reduce((sum, p) => sum + p.availableStorageGB, 0);
        const usedStorage = totalStorage - availableStorage;
        const activeRentals = rentals.filter(r => r.status === "ACTIVE").length;
        const providerCount = providers.length;

        setStats({
          totalStorage,
          usedStorage,
          availableStorage,
          activeRentals,
          providerCount
        });
      } catch (error) {
        console.error("Failed to fetch dashboard stats", error);
      }
    };
    fetchStats();
  }, []);

  const usagePercent = stats.totalStorage ? (stats.usedStorage / stats.totalStorage) * 100 : 0;

  return (
    <div>
      <div className="page-header">
        <h1>Welcome to DecentraStore</h1>
        <p>Secure, encrypted and decentralized storage.</p>
      </div>

      <div className="grid-3" style={{ marginBottom: "24px" }}>
        <div className="stat-card">
          <span className="stat-card-title">Provider Count</span>
          <span className="stat-card-value">{stats.providerCount}</span>
        </div>
        <div className="stat-card">
          <span className="stat-card-title">Total Network Storage</span>
          <span className="stat-card-value">{stats.totalStorage} GB</span>
        </div>
        <div className="stat-card">
          <span className="stat-card-title">Active Rentals</span>
          <span className="stat-card-value">{stats.activeRentals}</span>
        </div>
      </div>

      <div className="card">
        <h2>Network Storage Usage</h2>
        <div style={{ marginTop: "16px", marginBottom: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span><strong>{stats.usedStorage} GB</strong> Used</span>
            <span><strong>{stats.availableStorage} GB</strong> Available</span>
          </div>
          <div className="progress-bar-container">
            <div className="progress-bar-fill" style={{ width: `${usagePercent}%` }}></div>
          </div>
        </div>
        <p>Total capacity: {stats.totalStorage} GB</p>
      </div>
    </div>
  );
}
