export default function Settings() {
  return (
    <div>
      <div className="page-header">
        <h1>Settings</h1>
        <p>Manage your account and preferences.</p>
      </div>

      <div className="card" style={{ maxWidth: "600px" }}>
        <h2>Account Settings</h2>
        <div style={{ marginTop: "16px", marginBottom: "16px" }}>
          <label style={{ display: "block", marginBottom: "8px" }}>User ID</label>
          <input type="text" className="input-field" value="USER-001" disabled />
        </div>
        <div style={{ marginTop: "16px", marginBottom: "16px" }}>
          <label style={{ display: "block", marginBottom: "8px" }}>Theme</label>
          <select className="input-field">
            <option>Dark Mode</option>
          </select>
        </div>
        <button className="btn-primary" disabled>Save Changes</button>
      </div>
    </div>
  );
}
