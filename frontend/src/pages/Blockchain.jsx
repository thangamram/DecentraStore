import { useState, useEffect } from "react";
import axios from "axios";

export default function Blockchain() {
  const [data, setData] = useState({ blockchain: "Loading...", contract: "", projectName: "" });

  useEffect(() => {
    const fetchBlockchain = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/blockchain");
        setData(response.data);
      } catch (error) {
        setData({ blockchain: "Connection failed", contract: "", projectName: "" });
      }
    };
    fetchBlockchain();
  }, []);

  return (
    <div>
      <div className="page-header">
        <h1>Blockchain</h1>
        <p>DecentraStore stores file hash information on the blockchain to provide tamper-evident integrity verification.</p>
      </div>

      <div className="card">
        <h2>Network Status</h2>
        <div style={{ marginTop: "16px" }}>
          <p><strong>Status:</strong> <span className={`badge ${data.blockchain === "Connected" ? 'active' : 'expired'}`}>{data.blockchain}</span></p>
          <p style={{ marginTop: "8px" }}><strong>Project Name:</strong> {data.projectName}</p>
          <p style={{ marginTop: "8px" }}><strong>Smart Contract:</strong> <code style={{ backgroundColor: "var(--bg-secondary)", padding: "4px 8px", borderRadius: "4px" }}>{data.contract}</code></p>
        </div>
        <div style={{ marginTop: "24px", padding: "16px", backgroundColor: "var(--bg-secondary)", borderRadius: "8px" }}>
          <h3>How it works</h3>
          <p style={{ marginTop: "8px" }}>The actual files are not stored on the blockchain. The blockchain stores only the SHA-256 file integrity information. This provides immutable proof that your file has not been tampered with while keeping storage costs low and maintaining privacy.</p>
        </div>
      </div>
    </div>
  );
}
