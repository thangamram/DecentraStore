import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function Auth({ setAuthUser }) {
  const [role, setRole] = useState("provider");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const response = await axios.post("http://localhost:5000/api/auth/login", {
        username,
        role
      });
      const user = response.data.user;
      localStorage.setItem("decentraUser", JSON.stringify(user));
      setAuthUser(user);
      if (user.role === "provider") {
        navigate("/provider/dashboard");
      } else {
        navigate("/renter/dashboard");
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || err.message || "Login failed");
    }
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", backgroundColor: "var(--bg-main)" }}>
      <div className="card" style={{ width: "400px" }}>
        <h2 style={{ textAlign: "center", marginBottom: "24px" }}>DecentraStore Login</h2>
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", marginBottom: "8px" }}>Role:</label>
            <select
              className="input-field"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="provider">Storage Provider</option>
            </select>
          </div>
          <div style={{ marginBottom: "24px" }}>
            <label style={{ display: "block", marginBottom: "8px" }}>Username:</label>
            <input
              type="text"
              className="input-field"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={role === "provider" ? "e.g. PROVIDER-001" : "e.g. USER-001"}
              required
            />
          </div>
          {error && <div style={{ color: "var(--danger)", marginBottom: "16px" }}>{error}</div>}
          <button type="submit" className="btn-primary" style={{ width: "100%" }}>Login</button>
        </form>
      </div>
    </div>
  );
}
