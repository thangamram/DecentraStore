import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ethers } from "ethers";

export default function BlockchainTx() {
  const { hash } = useParams();
  const [txData, setTxData] = useState(null);
  const [receiptData, setReceiptData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchTx = async () => {
      try {
        const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
        const tx = await provider.getTransaction(hash);
        const receipt = await provider.getTransactionReceipt(hash);
        
        if (!tx) {
          setError("Transaction not found on local blockchain. Is your Hardhat node running?");
          return;
        }

        setTxData(tx);
        setReceiptData(receipt);
      } catch (err) {
        console.error(err);
        setError("Failed to connect to local blockchain node. Ensure 'npx hardhat node' is running.");
      } finally {
        setLoading(false);
      }
    };
    fetchTx();
  }, [hash]);

  if (loading) return <div>Querying Blockchain Ledger...</div>;

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Blockchain Explorer (Localnet)</h1>
          <p>Decentralized ledger verification</p>
        </div>
        <Link to="/provider/dashboard" className="btn-primary" style={{ textDecoration: 'none' }}>
          Back to Dashboard
        </Link>
      </div>

      {error ? (
        <div className="card" style={{ borderLeft: "4px solid var(--danger)" }}>
          <h3 style={{ color: "var(--danger)", margin: "0 0 8px 0" }}>Connection Failed</h3>
          <p>{error}</p>
        </div>
      ) : (
        <div className="card" style={{ wordBreak: 'break-all' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: "20px" }}>
            <h2 style={{ margin: 0 }}>Transaction Details</h2>
            <div style={{ 
              backgroundColor: receiptData?.status === 1 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', 
              color: receiptData?.status === 1 ? 'var(--success)' : 'var(--danger)', 
              padding: '6px 12px', 
              borderRadius: '20px',
              fontWeight: 'bold',
              fontSize: '14px'
            }}>
              {receiptData?.status === 1 ? '✓ SUCCESS (Mined)' : '✗ FAILED'}
            </div>
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "15px" }}>
            <tbody>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={{ padding: "16px 8px", width: "150px", color: "var(--text-secondary)" }}>Transaction Hash</td>
                <td style={{ padding: "16px 8px", fontWeight: "bold", color: "var(--primary)" }}>{txData.hash}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={{ padding: "16px 8px", color: "var(--text-secondary)" }}>Block Number</td>
                <td style={{ padding: "16px 8px", fontWeight: "bold" }}>{txData.blockNumber}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={{ padding: "16px 8px", color: "var(--text-secondary)" }}>From (Backend Wallet)</td>
                <td style={{ padding: "16px 8px" }}>{txData.from}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={{ padding: "16px 8px", color: "var(--text-secondary)" }}>To (Smart Contract)</td>
                <td style={{ padding: "16px 8px" }}>{txData.to}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={{ padding: "16px 8px", color: "var(--text-secondary)" }}>Gas Used</td>
                <td style={{ padding: "16px 8px" }}>{receiptData?.gasUsed?.toString()} units</td>
              </tr>
              <tr>
                <td style={{ padding: "16px 8px", color: "var(--text-secondary)" }}>Raw Input Data</td>
                <td style={{ padding: "16px 8px" }}>
                  <div style={{ backgroundColor: "var(--bg-main)", padding: "12px", borderRadius: "6px", fontSize: "12px", color: "var(--text-secondary)", maxHeight: "150px", overflowY: "auto" }}>
                    {txData.data}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
