import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./App.css";

import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Marketplace from "./pages/Marketplace";
import Rentals from "./pages/Rentals";
import Files from "./pages/Files";
import Upload from "./pages/Upload";
import Blockchain from "./pages/Blockchain";
import Activity from "./pages/Activity";
import Security from "./pages/Security";
import Settings from "./pages/Settings";
import Auth from "./pages/Auth";
import ProviderDashboard from "./pages/ProviderDashboard";
import ProviderStorage from "./pages/ProviderStorage";
import BlockchainTx from "./pages/BlockchainTx";

function App() {
  const [authUser, setAuthUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("decentraUser");
    if (stored) {
      setAuthUser(JSON.parse(stored));
    }
    setLoading(false);
  }, []);

  if (loading) return <div>Loading...</div>;

  if (!authUser) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="*" element={<Auth setAuthUser={setAuthUser} />} />
        </Routes>
      </BrowserRouter>
    );
  }

  return (
    <BrowserRouter>
      <Layout user={authUser} setAuthUser={setAuthUser}>
        <Routes>
          {authUser.role === "provider" ? (
            <>
              <Route path="/provider/dashboard" element={<ProviderDashboard user={authUser} />} />
              <Route path="/provider/storage" element={<ProviderStorage user={authUser} />} />
              <Route path="/provider/tx/:hash" element={<BlockchainTx />} />
              <Route path="*" element={<Navigate to="/provider/dashboard" replace />} />
            </>
          ) : (
            <>
              <Route path="/renter/dashboard" element={<Dashboard />} />
              <Route path="/renter/marketplace" element={<Marketplace />} />
              <Route path="/renter/rentals" element={<Rentals />} />
              <Route path="/renter/files" element={<Files />} />
              <Route path="/renter/upload" element={<Upload />} />
              <Route path="/renter/blockchain" element={<Blockchain />} />
              <Route path="/renter/activity" element={<Activity />} />
              <Route path="/renter/security" element={<Security />} />
              <Route path="/renter/settings" element={<Settings />} />
              <Route path="/" element={<Navigate to="/renter/dashboard" replace />} />
              <Route path="*" element={<Navigate to="/renter/dashboard" replace />} />
            </>
          )}
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;