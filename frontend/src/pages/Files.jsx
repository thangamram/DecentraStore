import { useState } from "react";
import axios from "axios";
import { decryptFile } from "../utils/decryption";

export default function Files() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const filename = localStorage.getItem("decentraStoreFileName") || "document.pdf.encrypted";

  const handleDownload = async () => {
    try {
      setLoading(true);
      setMessage("Downloading and decrypting...");
      const actualFilename = localStorage.getItem("decentraStoreFileName");

      if (!actualFilename) {
        setMessage("No uploaded file found in local storage.");
        return;
      }

      // Get encrypted file
      const response = await axios.get(`http://localhost:5000/api/files/${actualFilename}`, {
        responseType: "arraybuffer"
      });

      // Decrypt file
      const decryptedData = await decryptFile(response.data);

      // Create downloadable file
      const blob = new Blob([decryptedData]);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "decrypted-" + actualFilename.replace(".encrypted", "");
      link.click();
      URL.revokeObjectURL(url);

      setMessage("File decrypted and downloaded successfully!");
    } catch (error) {
      console.error(error);
      setMessage("Decryption failed. " + (error.message || ""));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>My Files</h1>
        <p>View and download your securely encrypted files.</p>
      </div>

      <div className="card">
        <table style={{ width: "100%", textAlign: "left" }}>
          <thead>
            <tr>
              <th>File Name</th>
              <th>Encryption</th>
              <th>Blockchain Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{filename}</td>
              <td><span className="badge available">YES</span></td>
              <td><span className="badge active">VERIFIED</span></td>
              <td>
                <button className="btn-secondary" onClick={handleDownload} disabled={loading}>
                  {loading ? "Processing..." : "Download"}
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        {message && (
          <div style={{ marginTop: "16px", padding: "12px", backgroundColor: "var(--bg-secondary)", borderRadius: "8px" }}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
}
