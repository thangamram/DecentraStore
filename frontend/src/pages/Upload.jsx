import { useState } from "react";
import axios from "axios";
import { encryptFile } from "../utils/encryption";
import { hashFile } from "../utils/hash";

export default function Upload() {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!file) {
      setMessage("Please select a file");
      return;
    }

    setLoading(true);
    setMessage("Encrypting and uploading...");

    try {
      // 1. Encrypt file
      const result = await encryptFile(file);

      // 2. Export encryption key
      const exportedKey = await crypto.subtle.exportKey("raw", result.key);
      const keyArray = Array.from(new Uint8Array(exportedKey));

      // 3. Store key and IV locally
      localStorage.setItem("decentraStoreKey", JSON.stringify(keyArray));
      localStorage.setItem("decentraStoreIV", JSON.stringify(Array.from(result.iv)));

      // 4. Generate SHA-256 hash of encrypted file
      const fileHash = await hashFile(result.encryptedData);

      // 5. Convert encrypted data to Blob
      const encryptedBlob = new Blob([result.encryptedData], {
        type: "application/octet-stream"
      });

      // 6. Prepare upload data
      const formData = new FormData();
      formData.append("file", encryptedBlob, file.name + ".encrypted");

      // 7. Upload encrypted file to backend
      const response = await axios.post("http://localhost:5000/api/upload", formData);

      // 8. Store generated filename
      localStorage.setItem("decentraStoreFileName", response.data.file.storedName);

      // 9. Register file hash on blockchain
      await axios.post("http://localhost:5000/api/blockchain/register-file", {
        fileHash: fileHash,
        providerId: "PROVIDER-001" // Legacy default for simple upload testing
      });

      setMessage("File encrypted, uploaded, and registered on blockchain successfully!");
    } catch (error) {
      console.error(error);
      const errorMsg = error.response?.data?.error 
        ? `${error.response.data.message} (${error.response.data.error})` 
        : (error.response?.data?.message || error.message);
      setMessage("Upload failed: " + errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Upload File</h1>
        <p>Encrypt your files, store them securely, and verify their integrity using blockchain.</p>
      </div>

      <div className="card">
        <h2>Secure Upload</h2>
        <p style={{ marginBottom: "24px" }}>Your file is encrypted before it is stored on the DecentraStore network.</p>
        
        <div className="upload-area">
          <p>Drag and drop your file here, or click below to select.</p>
          <input
            className="file-input"
            type="file"
            onChange={(e) => setFile(e.target.files[0])}
          />
          <button 
            className="btn-primary" 
            onClick={handleUpload}
            disabled={loading}
          >
            {loading ? "Processing..." : "🔐 Encrypt & Upload"}
          </button>
        </div>

        {message && (
          <div style={{ marginTop: "16px", padding: "12px", backgroundColor: "var(--bg-secondary)", borderRadius: "8px" }}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
}
