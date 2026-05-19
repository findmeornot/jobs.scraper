import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import Layout from "./components/layout";
import Dashboard from "./pages/Dashboard";
import AccountManagement from "./pages/AccountManagement";
import RegionManagement from "./pages/RegionManagement";

type Page = "dashboard" | "accounts" | "regions";

function App() {
  const [page, setPage] = useState<Page>("dashboard");

  return (
    <Layout currentPage={page} onNavigate={setPage}>
      {page === "dashboard" && <Dashboard />}
      {page === "accounts" && <AccountManagement />}
      {page === "regions" && <RegionManagement />}
    </Layout>
  );
}

const root = createRoot(document.getElementById("root")!);
root.render(<App />);
