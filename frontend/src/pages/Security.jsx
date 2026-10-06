export default function Security() {
  return (
    <div>
      <div className="page-header">
        <h1>Security Architecture</h1>
        <p>Understanding how DecentraStore keeps your data safe.</p>
      </div>

      <div className="grid-2">
        <div className="card">
          <h2>AES-GCM Encryption</h2>
          <p style={{ marginTop: "8px" }}>All files are encrypted locally in your browser before they are uploaded. The encryption key never leaves your device.</p>
        </div>
        
        <div className="card">
          <h2>SHA-256 Integrity Hash</h2>
          <p style={{ marginTop: "8px" }}>We generate a cryptographic hash of your encrypted file to ensure it is never tampered with.</p>
        </div>
        
        <div className="card">
          <h2>Blockchain Verification</h2>
          <p style={{ marginTop: "8px" }}>The actual file is not stored on the blockchain. The blockchain stores file integrity information, providing a tamper-evident audit log.</p>
        </div>

        <div className="card">
          <h2>Encrypted Provider Storage</h2>
          <p style={{ marginTop: "8px" }}>Storage providers only receive the encrypted file chunks. They cannot read your data or know what it contains.</p>
        </div>
      </div>
    </div>
  );
}
