import { Link, useLocation, useNavigate } from "react-router-dom";

export default function Layout({ children, user, setAuthUser }) {
  const location = useLocation();
  const navigate = useNavigate();

  const renterNavItems = [
    { name: "Dashboard", path: "/renter/dashboard" },
    { name: "Storage Marketplace", path: "/renter/marketplace" },
    { name: "My Rentals", path: "/renter/rentals" },
    { name: "My Files", path: "/renter/files" },
    { name: "Upload", path: "/renter/upload" },
    { name: "Blockchain", path: "/renter/blockchain" },
    { name: "Activity", path: "/renter/activity" },
    { name: "Security", path: "/renter/security" },
    { name: "Settings", path: "/renter/settings" }
  ];

  const providerNavItems = [
    { name: "Provider Dashboard", path: "/provider/dashboard" },
    { name: "My Storage", path: "/provider/storage" }
  ];

  const navItems = user?.role === "provider" ? providerNavItems : renterNavItems;

  const handleLogout = () => {
    localStorage.removeItem("decentraUser");
    setAuthUser(null);
    navigate("/");
  };

  return (
    <div className="layout-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          DecentraStore
        </div>
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${location.pathname === item.path ? "active" : ""}`}
            >
              {item.name}
            </Link>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="network-status">
            <span className="network-dot"></span>
            Blockchain Connected
          </div>
          <div className="user-profile">
            👤 {user?.name || user?.id || "USER-001"}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-wrapper">
        <header className="topbar">
          <div className="topbar-title">
            {navItems.find((n) => n.path === location.pathname)?.name || "DecentraStore"}
          </div>
          <div className="topbar-actions">
            <div className="network-status">
              <span className="network-dot"></span>
              Connected
            </div>
            <div>{user?.name || user?.id || "USER-001"}</div>
            <button className="btn-secondary" onClick={handleLogout} style={{ padding: "4px 8px", fontSize: "12px", marginLeft: "12px" }}>Logout</button>
          </div>
        </header>

        <section className="content-area">
          {children}
        </section>
      </main>
    </div>
  );
}
